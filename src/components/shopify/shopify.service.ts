import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { ProductEntity } from '@entities/product.entity';
import * as axios from 'axios';
import * as qs from 'querystring';
import { isEmpty, keyBy } from 'lodash';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ProductImageEntity } from '@entities/product-image.entity';
import { log } from 'console';
import { UserEntity } from '@entities/user.entity';
import { ShopifyCustomer, ShopifyOrder } from './shopify.constant';
import { getKeyByObject } from '@utils/common';
import { OrderEntity } from '@entities/order.entity';

import * as Bluebird from 'bluebird';
import { OrderDetailEntity } from '@entities/order-detail.entity';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,

    @InjectRepository(OrderDetailEntity)
    private readonly orderDetailRepository: Repository<OrderDetailEntity>,

    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}

  private async createAxiosInstance() {
    return axios.default.create({
      baseURL: process.env.SHOPIFY_SHOP_NAME,
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESSKEY,
      },
    });
  }

  private queryString(updatedAtMin: string, limit: number, sinceId: string) {
    return qs.stringify({
      updated_at_min: updatedAtMin,
      limit,
      since_id: sinceId,
      order: 'id asc',
    });
  }

  private async fetchProduct(query?: string) {
    const axiosInstance = await this.createAxiosInstance();
    const fetchProduct = await axiosInstance({
      url: `/admin/api/2024-01/products.json?${query}`,
      method: 'GET',
    });

    return fetchProduct?.data?.products;
  }

  private mapProducts(products: Array<any>) {
    if (isEmpty(products)) return [];

    return products.map((p) => {
      const { id, ...rest } = p;
      return { ...rest, shopify_id: id };
    });
  }

  private async upsertProduct(data: any) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const existedProduct = await this.productRepository.findOneBy({
        shopifyId: data.shopify_id,
      });

      const product = new ProductEntity();
      product.shopifyId = data?.shopify_id;
      product.name = data?.title;
      product.description = data?.body_html?.split(/<\/?[^>]+>/)[1] || '';
      product.price = data?.variants?.[0]?.price;

      const stockAmountShopify = data?.variants?.[0]?.inventory_quantity || 0;
      product.stockAmount = stockAmountShopify;

      if (existedProduct) {
        product.id = existedProduct.id;

        if (Number(stockAmountShopify) > existedProduct.stockAmount) {
          product.stockAmount = existedProduct.stockAmount;
        }

        queryRunner.manager.delete(ProductImageEntity, {
          productId: existedProduct.id,
        });

        this.logger.log(
          `[SHOPIFY][UPDATE_PRODUCT]: shopify_id: ${data.shopify_id}`,
        );
      } else {
        this.logger.log(
          `[SHOPIFY][CREATE_PRODUCT]: shopify_id${data.shopify_id}`,
        );
      }

      await this.productRepository.save(product);
      const result = await queryRunner.manager.save(product);

      const productImages = data?.images?.map((image) => {
        const productImage = new ProductImageEntity();
        productImage['productId'] = result.id;
        productImage['url'] = image.src;

        return productImage;
      });

      await queryRunner.manager.save(productImages);

      await queryRunner.commitTransaction();
    } catch (error) {
      log('[ERROR]: ', error);
      await queryRunner.rollbackTransaction();

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .withMessage(error.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  public async syncProduct() {
    try {
      const checkExistedProducts = await this.productRepository.findBy({
        shopifyId: Not(IsNull()),
      });

      const pivot = !isEmpty(checkExistedProducts)
        ? new Date(Date.now() - 5 * 60 * 1000)
        : new Date(null);

      const updatedAtMin = pivot.toISOString();
      const limit = 10;
      let sinceId = '';
      let products = [];

      const timestamp = new Date().getTime();
      this.logger.log(`[SHOPIFY][SYNC_PRODUCT][START]`);
      const query = this.queryString(updatedAtMin, limit, sinceId);
      products = await this.fetchProduct(query);
      if (products.length) {
        sinceId = products.at(-1).id;
      }

      const mappedProducts = this.mapProducts(products);

      for (const product of mappedProducts) {
        await this.upsertProduct(product);
      }

      this.logger.log(
        `[SHOPIFY][SYNC_PRODUCT][END]: ${new Date().getTime() - timestamp} ms`,
      );

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage('Đồng bộ thành công')
        .build();
    } catch (error) {
      this.logger.error('[SHOPIFY_SYNC][ERROR]: ', error);

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Đồng bộ thất bại')
        .build();
    }
  }

  // SYNC ORDER
  public async syncOrder() {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await this.syncProduct();
      await this.syncCustomer();
      const orders: ShopifyOrder[] = await this.fetchOrder();

      const [users, products, systemOrders] = await Promise.all([
        this.userRepository.findBy({
          shopifyCustomerId: Not(IsNull()),
          source: 'shopify',
        }),
        this.productRepository.findBy({
          shopifyId: Not(IsNull()),
        }),
        this.orderRepository.findBy({
          source: 'shopify',
        }),
      ]);

      const userMap = keyBy(users, 'shopifyCustomerId');
      const productMap = keyBy(products, 'shopifyId');
      const systemOrderMap = keyBy(systemOrders, 'shopifyOrderId');

      await Bluebird.mapSeries(orders, async (order) => {
        const {
          customer,
          line_items = [],
          shipping_address,

          current_total_price,
          financial_status,
          fulfillment_status,
          status,
          id: shopifyOrderId,
        } = order;

        const {
          first_name,
          last_name,
          city,
          country,
          phone,
          address1,
          address2,
        } = shipping_address;

        const totalAmount = line_items.reduce(
          (acc, { quantity }) => acc + quantity,
          0,
        );

        const currentOrder = systemOrderMap[shopifyOrderId] as OrderEntity;
        // đã tồn tại order thì chỉ cập nhật trạng thái
        if (!isEmpty(currentOrder || {})) {
          currentOrder['status'] = status || financial_status;
          currentOrder['financialStatus'] = financial_status;
          currentOrder['fulfillmentStatus'] = fulfillment_status;

          await queryRunner.manager.save(currentOrder);
          return;
        }

        let addressOrder = '';
        if (address1?.trim()) addressOrder += address1;
        if (address2?.trim()) addressOrder += `, ${address2}`;
        if (city?.trim()) addressOrder += `, ${city}`;
        if (country?.trim()) addressOrder += `, ${country}`;

        const orderEntity = new OrderEntity();
        orderEntity.userId = userMap[customer?.id]?.id || null;
        orderEntity.status = status || financial_status;
        orderEntity.financialStatus = financial_status;
        orderEntity.fulfillmentStatus = fulfillment_status;
        orderEntity.totalPrice = Number(current_total_price);
        orderEntity.totalAmount = totalAmount;
        orderEntity.paymentType = 'shopify_payment';
        orderEntity.receiver = `${first_name} ${last_name}`;
        orderEntity.phone = phone;
        orderEntity.address = addressOrder;
        orderEntity.source = 'shopify';
        orderEntity.shopifyOrderId = order.id.toString();

        const orderSaved = await queryRunner.manager.save(orderEntity);
        console.log('🚀 [LOGGER]  orderSaved:', orderSaved);

        const orderDetails = line_items.map((lineItem) => {
          const { product_id, quantity, price } = lineItem;
          const product = productMap[product_id];

          const orderDetail = new OrderDetailEntity();
          orderDetail.orderId = orderSaved.id;
          orderDetail.productId = product?.id || null;
          orderDetail.amount = Number(quantity);
          orderDetail.unitPrice = Number(price);

          return orderDetail;
        });
        await queryRunner.manager.save(orderDetails);
      });

      await queryRunner.commitTransaction();
      return new ResponseBuilder(orders)
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage('Đồng bộ đơn hàng thành công')
        .build();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('[SHOPIFY_SYNC][ORDER][ERROR]: ', error);

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Đồng bộ đơn hàng thất bại')
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  private async fetchOrder() {
    const axiosInstance = await this.createAxiosInstance();
    const fetchOrder = await axiosInstance({
      url: `/admin/api/2024-10/orders.json?status=any`,
      method: 'GET',
    });

    return fetchOrder?.data?.orders;
  }

  // SYNC CUSTOMER
  public async syncCustomer() {
    try {
      const customers: ShopifyCustomer[] = await this.fetchCustomer();
      const users = await this.upsertCustomer(customers);

      return new ResponseBuilder(users)
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage('Đồng bộ khách hàng thành công')
        .build();
    } catch (error) {
      this.logger.error('[SHOPIFY_SYNC][CUSTOMER][ERROR]: ', error);

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Đồng bộ khách hàng thất bại')
        .build();
    }
  }

  private async upsertCustomer(customers: ShopifyCustomer[]) {
    const emails = getKeyByObject(customers, 'email');

    const currentUsers = await this.userRepository.findBy({
      email: In(emails),
    });

    const mappedCustomers = customers.map(
      ({ email, first_name, last_name, id }) => {
        return {
          shopifyCustomerId: `${id}`,
          email,
          username: `${first_name || ''} ${last_name || ''}`,
          source: 'shopify',
        };
      },
    );

    const customerMap = keyBy(mappedCustomers, 'email');
    const userMap = keyBy(currentUsers, 'email');

    currentUsers.forEach((user) => {
      const { source: currentSource } = user;
      const { shopifyCustomerId, username, source } = customerMap[user.email];

      user.username = username;
      user.source = `shopify`;
      user.shopifyCustomerId = shopifyCustomerId;
    });

    const newCustomers = mappedCustomers.filter(({ email }) => !userMap[email]);

    const users = await this.userRepository.save([
      ...currentUsers,
      ...newCustomers,
    ]);

    return users;
  }

  private async fetchCustomer() {
    const axiosInstance = await this.createAxiosInstance();
    const fetchCustomer = await axiosInstance({
      url: `/admin/api/2024-10/customers.json`,
      method: 'GET',
    });

    return fetchCustomer?.data?.customers;
  }
}
