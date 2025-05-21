import * as bcrypt from 'bcrypt';
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
import { UserEntity } from '@entities/user.entity';
import { ShopifyCustomer, ShopifyOrder } from './shopify.constant';
import { OrderEntity } from '@entities/order.entity';

import * as Bluebird from 'bluebird';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { CronExpression } from '@nestjs/schedule';
import * as cron from 'node-cron';
import { UpdateCronJobDto } from './dto/update-cronjob.dto';
import { convertShopifyOrderStatusToLocalShop, convertToLocalPhoneNumber } from '@utils/common';                                                                

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  private cronSchedules = {
    customer: CronExpression.EVERY_DAY_AT_11PM, //  5 phút
    product: CronExpression.EVERY_DAY_AT_11PM, //  5 phút
    order: CronExpression.EVERY_DAY_AT_11PM, //  5 phút
  };

  onModuleInit() {
    console.log('Init cron jobs');

    this.startCronJobs();
  }

  onModuleDestroy() {
    this.stopAllCronJobs();
  }

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
      url: `/admin/api/2024-01/products.json?${query || ''}`,
      method: 'GET',
    });

    return fetchProduct?.data?.products;
  }

  public async updateInventoryQuantityShopifyProduct(
    shopifyProductId: number,
    numberOfProductToBuy: number
  ) {
    try {
      const axiosInstance = await this.createAxiosInstance();
  
      // 1️⃣ Fetch product details to get the variant ID
      const productResponse = await axiosInstance.get(
        `/admin/api/2024-01/products/${shopifyProductId}.json`
      );
      const product = productResponse.data.product;
  
      if (!product || !product.variants || product.variants.length === 0) {
        throw new Error('No variants found for this product');
      }
  
      const variantId = product.variants[0].id;
      const inventoryItemId = product.variants[0].inventory_item_id;
      const availableQuantity = product.variants[0].inventory_quantity;

      if (availableQuantity < numberOfProductToBuy) {
        throw new Error('Not enough inventory available for this product');
      }

      // 2️⃣ Get the Inventory Level (Location ID)
      const locationsResponse = await axiosInstance.get(
        `/admin/api/2024-01/locations.json`
      );
      const locations = locationsResponse.data.locations;
  
      if (!locations || locations.length === 0) {
        throw new Error('No locations found in Shopify store');
      }
  
      const locationId = locations[0].id; // Assume first location is the one to update
      const remainingQuantity = availableQuantity - numberOfProductToBuy;

      // 3️⃣ Update inventory quantity using Inventory API
      const inventoryUpdateResponse = await axiosInstance.post(
        `/admin/api/2024-01/inventory_levels/set.json`,
        {
          location_id: locationId,
          inventory_item_id: inventoryItemId,
          available: remainingQuantity,
        }
      );
  
      console.log('🚀 [LOGGER] Inventory updated:', inventoryUpdateResponse.data);
      return inventoryUpdateResponse.data;
    } catch (error) {
      // this.logger.error(
      //   `[SHOPIFY][UPDATE_INVENTORY]: Error updating inventory for product ${shopifyProductId}`,
      //   error
      // );
      // throw new Error(error.response?.data?.errors || 'Failed to update inventory');
      this.logger.error(
        `[SHOPIFY][UPDATE_INVENTORY]: Error updating inventory for product ${shopifyProductId}`,
        error
      );
      throw new Error(
        error.response?.data?.errors?.[0] || 
        error.message || 
        'Failed to update inventory'
      );
    }
  }
  
  // public async getProductByShopifyId(shopifyProductId: number,) {
  //   try {
  //     const axiosInstance = await this.createAxiosInstance();
  
  //     // 1️⃣ Fetch product details to get the variant ID
  //     const productResponse = await axiosInstance.get(
  //       `/admin/api/2024-01/products/${shopifyProductId}.json`
  //     );
  //     const product = productResponse.data.product;
  
  //     if (!product || !product.variants || product.variants.length === 0) {
  //       throw new Error('No variants found for this product');
  //     }
  
  //     return product;
  //   } catch (error) {
  //     this.logger.error(
  //       `[SHOPIFY][GET_PRODUCT_SHOPIFY]: Error get for product ${shopifyProductId}`,
  //       error
  //     );
  //     throw new Error(error.response?.data?.errors || 'Failed to get product');
  //   }
  // }

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
        shopifyId: Not(IsNull()),
        name: data?.title,
      });

      let product: ProductEntity;

      if (existedProduct) {
        const stockAmountShopify = data?.variants?.[0]?.inventory_quantity || 0;
        // const stockAmount = existedProduct.stockAmount;
        product = Object.assign(new ProductEntity(), existedProduct, {
          name: data?.title ?? existedProduct.name,
          description:
            data?.body_html?.split(/<\/?[^>]+>/)[1] ||
            existedProduct.description,
          price: data?.variants?.[0]?.price ?? existedProduct.price,
          stockAmount: stockAmountShopify,
        });

        this.logger.log(
          `[SHOPIFY][UPDATE_PRODUCT]: shopify_id: ${data.shopify_id}`,
        );
      } else {
        product = Object.assign(new ProductEntity(), {
          shopifyId: data?.shopify_id,
          name: data?.title,
          description: data?.body_html?.split(/<\/?[^>]+>/)[1] || '',
          price: data?.variants?.[0]?.price,
          stockAmount: data?.variants?.[0]?.inventory_quantity || 0,
          categoryId: 6,
          branchId: 6,
          sold: 0,
        });

        this.logger.log(
          `[SHOPIFY][CREATE_PRODUCT]: shopify_id: ${data.shopify_id}`,
        );
      }

      const result = await queryRunner.manager.save(product);

      if (existedProduct) {
        await queryRunner.manager.delete(ProductImageEntity, {
          productId: existedProduct.id,
        });
      }

      const productImages = data?.images?.map((image) => {
        const productImage = new ProductImageEntity();
        productImage.productId = result.id;
        productImage.url = image.src;
        return productImage;
      });

      await queryRunner.manager.save(productImages);

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(`[ERROR]: `, error);
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
      products = await this.fetchProduct();
      console.log('🚀 [LOGGER] products:', products);

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
          // source: 'shopify',
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

          total_price,
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
          currentOrder['status'] = convertShopifyOrderStatusToLocalShop(status || financial_status);
          currentOrder['financialStatus'] = convertShopifyOrderStatusToLocalShop(financial_status);
          currentOrder['fulfillmentStatus'] = convertShopifyOrderStatusToLocalShop(fulfillment_status);
          
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
        orderEntity.status = convertShopifyOrderStatusToLocalShop(status) || convertShopifyOrderStatusToLocalShop(financial_status);
        orderEntity.financialStatus = convertShopifyOrderStatusToLocalShop(financial_status);
        orderEntity.fulfillmentStatus = convertShopifyOrderStatusToLocalShop(fulfillment_status);
        orderEntity.totalPrice = Number(total_price);
        orderEntity.totalAmount = totalAmount;
        orderEntity.paymentType = 'shopify_payment';
        orderEntity.receiver = `${first_name} ${last_name}` || userMap[customer?.id]?.username;
        orderEntity.phone = phone || userMap[customer?.id]?.phoneNumber;
        orderEntity.address = addressOrder || userMap[customer?.id]?.address;
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
          orderDetail.unitPrice = Number(price) + Number(price) * 0.1;

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
      url: `/admin/api/2024-10/orders.json`,
      method: 'GET',
    });

    return fetchOrder?.data?.orders;
  }

  public async syncCustomer() {
    try {
      const FIVE_MINUTES = 5 * 60 * 1000;
      const currentCustomers = await this.userRepository.findBy({
        shopifyCustomerId: Not(IsNull()),
      });

      const pivot = !isEmpty(currentCustomers)
        ? new Date(Date.now() - FIVE_MINUTES)
        : new Date(null);

      const updatedAtMin = pivot.toISOString();
      const limit = 10;
      let sinceId = '';
      let customers = [];

      const timestamp = new Date().getTime();
      this.logger.log(`[SHOPIFY][SYNC_CUSTOMER][START]`);
      // do {
        const query = this.queryString(updatedAtMin, limit, sinceId);
        customers = await this.fetchCustomer(query);
        if (customers.length) {
          sinceId = customers.at(-1).id;
        }

        const mappedCustomers = this.mapCustomers(customers);

        for (const customer of mappedCustomers) {
          await this.upsertCustomer(customer);
        }
      // } while (customers.length);

      this.logger.log(
        `[SHOPIFY][SYNC_CUSOMTER][END]: ${new Date().getTime() - timestamp} ms`,
      );

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage('Đồng bộ thành công')
        .build();
    } catch (error) {
      this.logger.error('[SHOPIFY][SYNC_CUSOMTER][ERROR]: ', error);

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Đồng bộ thất bại')
        .build();
    }
  }

  private mapCustomers(customers: ShopifyCustomer[]) {
    const mappedCustomers = customers.map(
      ({ email, first_name, last_name, id, phone }) => {
        
        return {
          shopifyCustomerId: `${id}`,
          email,
          username: `${first_name || ''} ${last_name || ''}`,
          phone: convertToLocalPhoneNumber(phone),
        };
      },
    );

    return mappedCustomers;
  }

  private async upsertCustomer(data: {
    shopifyCustomerId: string;
    email: string;
    username: string;
    phone: string
  }) {
    const { shopifyCustomerId, email, phone, username } = data;

    const [currentCustomerFindByPhone, currentCustomerFindByEmail] = await Promise.all([
      this.userRepository.findOneBy({
        phoneNumber: phone,
      }),
      this.userRepository.findOneBy({
        email,
      }),

    ]);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      let customer;

      if (currentCustomerFindByPhone) {
        customer = Object.assign(new UserEntity(), currentCustomerFindByPhone, {
          shopifyCustomerId,
          username,
          email: currentCustomerFindByPhone.email,
          phoneNumber: phone,
        });
        this.logger.log(
          `[SHOPIFY][UPDATE_CUSTOMER]: shopifyCustomerId: ${shopifyCustomerId}`,
        );
        await queryRunner.manager.save(customer);
      }
      else if (!currentCustomerFindByEmail && !currentCustomerFindByPhone) {
        const newPassword = await bcrypt.hash(phone, 7)
        customer = Object.assign(new UserEntity(), {
          shopifyCustomerId,
          username,
          email,
          phoneNumber: phone,
          gender: "other",
          password: newPassword,
          source: 'shopify',
        });
        this.logger.log(
          `[SHOPIFY][CREATE_CUSTOMER]: shopifyCustomerId: ${shopifyCustomerId}`,
        );
        await queryRunner.manager.save(customer);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      console.log('🚀 [LOGGER] error:', error);
      await queryRunner.rollbackTransaction();

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .withMessage(error.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  private async fetchCustomer(query?: string) {
    const axiosInstance = await this.createAxiosInstance();
    const fetchCustomer = await axiosInstance({
      url: `/admin/api/2024-10/customers.json`,
      method: 'GET',
    });

    return fetchCustomer?.data?.customers;
  }

  // CRONJOB FUNCTION
  public async updateCron(updateCronJobDto: UpdateCronJobDto) {
    const { job, cronExpression } = updateCronJobDto;

    if (!['customer', 'product', 'order'].includes(job)) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Job không hợp lệ')
        .build();
    }

    if (cronExpression === 'disable') {
      this.disableCronJob(job);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(`Tắt cron job ${job} thành công`)
        .build();
    }

    try {
      this.updateCronJob(job, cronExpression);
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(`Cập nhật cron job ${job} thành công`)
        .build();
    } catch (error) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .withMessage(error.message)
        .build();
    }
  }

  private startCronJobs() {
    Object.keys(this.cronSchedules).forEach((key) => {
      this.createCronJob(key, this.cronSchedules[key]);
    });
  }

  private createCronJob(key: string, cronExpression: string) {
    if (this.cronJobs.has(key)) {
      this.cronJobs.get(key)?.stop();
      this.cronJobs.delete(key);
    }

    const task = cron.schedule(cronExpression, () => {
      if (key === 'customer') {
        console.log('Start cron job sync customer');
        this.syncCustomer();
      } else if (key === 'product') {
        console.log('Start cron job sync product');
        this.syncProduct();
      } else if (key === 'order') {
        console.log('Start cron job sync order');
        this.syncOrder();
      }
    });

    this.cronJobs.set(key, task);
  }

  private stopAllCronJobs() {
    this.cronJobs.forEach((task) => {
      task.stop();
    });

    this.cronJobs.clear();
  }

  private updateCronJob(key: string, cronExpression: string) {
    this.createCronJob(key, cronExpression);
  }

  private disableCronJob(key: string) {
    if (this.cronJobs.has(key)) {
      this.cronJobs.get(key)?.stop();
      this.cronJobs.delete(key);
    }
  }
}
