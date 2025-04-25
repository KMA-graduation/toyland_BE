import * as bcrypt from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { ProductEntity } from '@entities/product.entity';
import * as axios from 'axios';
import * as qs from 'querystring';
import { isEmpty } from 'lodash';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ProductImageEntity } from '@entities/product-image.entity';
import { decode } from 'he';
import { convertToLocalPhoneNumber, VND_TO_USD } from '@utils/common';
import { UserEntity } from '@entities/user.entity';
import { OrderEntity } from '@entities/order.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';

@Injectable()
export class ShopBaseService {
  private readonly logger = new Logger(ShopBaseService.name);

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

  base64Encode(text: any) {
    return Buffer.from(text).toString('base64');
  }

  private async createAxiosInstance(qs?: string) {
    const shop = process.env.SHOP_BASE_NAME;
    const key = process.env.SHOP_BASE_KEY;
    const password = process.env.SHOP_BASE_PASSWORD;
    const token = this.base64Encode(`${key}:${password}`);

    const url = `https://${shop}.onshopbase.com/admin/products.json${
      qs ? `?${qs}` : ''
    }`;

    const headers = {
      Authorization: `Basic ${token}`,
    };

    const options = {
      url,
      method: 'GET',
      headers,
      json: true,
    };

    return await axios.default.get(url, options);
  }

  private async fetchCustomer(query?: string) {
    const shop = process.env.SHOP_BASE_NAME;
    const key = process.env.SHOP_BASE_KEY;
    const password = process.env.SHOP_BASE_PASSWORD;
    const token = this.base64Encode(`${key}:${password}`);
    const url = `https://${shop}.onshopbase.com/admin/customers.json${
      query ? `?${query}` : ''
    }`;

    const headers = {
      Authorization: `Basic ${token}`,
    };

    const options = {
      url,
      method: 'GET',
      headers,
      json: true,
    };

    const response = await axios.default.get(url, options);

    return response?.data?.customers;
  }

  private async fetchDraftOrder(query?: string) {
    //shop-name.onshopbase.com/admin/draft_orders.json
    const shop = process.env.SHOP_BASE_NAME;
    const key = process.env.SHOP_BASE_KEY;
    const password = process.env.SHOP_BASE_PASSWORD;
    const token = this.base64Encode(`${key}:${password}`);
    const url = `https://${shop}.onshopbase.com/admin/draft_orders.json?${
      query ? `?${query}` : ''
    }`;
    const headers = {
      Authorization: `Basic ${token}`,
    };

    const options = {
      url,
      method: 'POST',
      headers,
      json: true,
    };

    const response = await axios.default.get(url, options);

    console.log('🚀 [LOGGER] response:', response.data);

    return response?.data?.draft_orders;
  }

  private mapProducts(products: Array<any>) {
    if (isEmpty(products)) return [];

    return products.map((p) => {
      const { id, ...rest } = p;
      return { ...rest, shop_base_id: id.toString() };
    });
  }

  private queryString(updatedAtMin: string, limit: number, sinceId: string) {
    return qs.stringify({
      updated_at_min: updatedAtMin,
      limit,
      since_id: sinceId,
      sort_field: 'id',
    });
  }

  private async fetchProduct(query?: string) {
    const fetchProduct = await this.createAxiosInstance(query);

    return fetchProduct?.data?.products;
  }

  private async upsertProduct(data: any) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();
  
    try {
      const existedProduct = await this.productRepository.findOneBy({
        shopBaseId: data.shop_base_id,
      });
  
      let product: ProductEntity;
      const decodeDescription = decode(data?.body_html);
      const plainDescription = decodeDescription.replace(/<[^>]+>/g, '');
      const price = data?.variants?.[0]?.price || 0;
      const stockAmountShopBase = data?.variants?.[0]?.inventory_quantity || 0;
  
      if (existedProduct) {
        product = Object.assign(new ProductEntity(), existedProduct, {
          name: data?.title ?? existedProduct.name,
          description: plainDescription || existedProduct.description,
          price: price * VND_TO_USD || existedProduct.price,
          stockAmount:
            stockAmountShopBase > existedProduct.stockAmount
              ? stockAmountShopBase
              : existedProduct.stockAmount,
        });
  
        this.logger.log(
          `[SHOP_BASE][UPDATE_PRODUCT]: shop_base_id: ${data.shop_base_id}`,
        );
  
        await queryRunner.manager.delete(ProductImageEntity, {
          productId: existedProduct.id,
        });
      } else {
        product = Object.assign(new ProductEntity(), {
          shopBaseId: data?.shop_base_id,
          name: data?.title,
          description: plainDescription,
          price: price * VND_TO_USD,
          stockAmount: stockAmountShopBase,
          categoryId: 6,
          branchId: 6,
          sold: 0,
        });
  
        this.logger.log(
          `[SHOP_BASE][CREATE_PRODUCT]: shop_base_id: ${data.shop_base_id}`,
        );
      }
  
      const result = await queryRunner.manager.save(product);
  
      const productImages = data?.images?.map((image) => {
        const productImage = new ProductImageEntity();
        productImage.productId = result.id;
        productImage.url = image.src;
        return productImage;
      });
  
      await queryRunner.manager.save(productImages);
  
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(`[SHOP_BASE][CREATE_PRODUCT][ERROR]:`, error);
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
        shopBaseId: Not(IsNull()),
      });

      const pivot = !isEmpty(checkExistedProducts)
        ? new Date(Date.now() - 5 * 60 * 1000)
        : new Date(null);

      const updatedAtMin = pivot.toISOString();
      const limit = 10;
      let sinceId = '';
      let products = [];

      const timestamp = new Date().getTime();
      this.logger.log(`[SHOP_BASE][SYNC_PRODUCT][START]`);
      do {
        const query = this.queryString(updatedAtMin, limit, sinceId);
        products = await this.fetchProduct(query);
        if (products.length) {
          sinceId = products.at(-1).id;
        }

        const mappedProducts = this.mapProducts(products);

        for (const product of mappedProducts) {
          await this.upsertProduct(product);
        }
      } while (products.length);

      this.logger.log(
        `[SHOP_BASE][SYNC_PRODUCT][END]: ${
          new Date().getTime() - timestamp
        } ms`,
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

  public async syncCusomer() {
    try {
      const customers = await this.fetchCustomer();
      const mappedCustomers = this.mapCustomers(customers);

      await Promise.all(
        mappedCustomers.map((customer) => this.upsertCustomer(customer)),
      );
    } catch (error) {
      this.logger.error('[SHOPBASE][SYNC_CUSOMTER][ERROR]: ', error);

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Đồng bộ thất bại')
        .build();
    }
  }

  public async syncDraftOrder() {
    try {
      const drafOrders = await this.fetchDraftOrder();
      console.log('🚀 [LOGGER] drafOrders:', drafOrders);
    } catch (error) {
      console.log('🚀 [LOGGER] error:', error);
    }
  }

  private async upsertCustomer(data: {
    shopbaseCustomerId: string;
    email: string;
    username: string;
    phone: string;
  }) {
    const { shopbaseCustomerId, email, phone, username } = data;
  
    const [currentCustomerFindByPhone, currentCustomerFindByEmail] = await Promise.all([
      this.userRepository.findOneBy({ phoneNumber: phone }),
      this.userRepository.findOneBy({ email }),
    ]);
  
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();
  
    try {
      let customer: UserEntity;
  
      if (currentCustomerFindByPhone) {
        customer = Object.assign(new UserEntity(), currentCustomerFindByPhone, {
          shopbaseCustomerId,
          username,
          email: currentCustomerFindByPhone.email,
          phoneNumber: phone,
        });
  
        this.logger.log(
          `[SHOPBASE][UPDATE_CUSTOMER]: shopbaseCustomerId: ${shopbaseCustomerId}`,
        );
  
        await queryRunner.manager.save(customer);
      } else if (!currentCustomerFindByEmail && !currentCustomerFindByPhone) {
        const newPassword = await bcrypt.hash(phone, 7);
  
        customer = Object.assign(new UserEntity(), {
          shopbaseCustomerId,
          username,
          email,
          phoneNumber: phone,
          gender: 'other',
          password: newPassword,
        });
  
        this.logger.log(
          `[SHOPBASE][CREATE_CUSTOMER]: shopbaseCustomerId: ${shopbaseCustomerId}`,
        );
  
        await queryRunner.manager.save(customer);
      }
  
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(`[SHOPBASE][UPSERT_CUSTOMER][ERROR]:`, error);
      await queryRunner.rollbackTransaction();
  
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .withMessage(error.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }
  

  private mapCustomers(customers: any[]) {
    const mappedCustomers = customers.map(
      ({ email, first_name, last_name, id, phone }) => {
        return {
          shopbaseCustomerId: `${id}`,
          email,
          username: `${first_name || ''} ${last_name || ''}`,
          phone: convertToLocalPhoneNumber(phone),
        };
      },
    );

    return mappedCustomers;
  }
}
