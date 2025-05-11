import * as bcrypt from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { ProductEntity } from '@entities/product.entity';
import * as axios from 'axios';
import * as qs from 'querystring';
import { add, isEmpty, keyBy } from 'lodash';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ProductImageEntity } from '@entities/product-image.entity';
import { decode } from 'he';
import { convertToLocalPhoneNumber, VND_TO_USD } from '@utils/common';
import { UserEntity } from '@entities/user.entity';
import { OrderEntity } from '@entities/order.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import * as Bluebird from 'bluebird';
import * as cron from 'node-cron';
import { CronExpression } from '@nestjs/schedule';
import { UpdateCronJobDto } from '@components/shopify/dto/update-cronjob.dto';

@Injectable()
export class ShopBaseService {
  private readonly logger = new Logger(ShopBaseService.name);
   private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  
    private cronSchedules = {
      customer: CronExpression.EVERY_DAY_AT_11PM, 
      product: CronExpression.EVERY_DAY_AT_11PM, 
      order: CronExpression.EVERY_DAY_AT_11PM, 
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
    const shop = process.env.SHOP_BASE_NAME;
    const url = `https://${shop}.onshopbase.com/admin/draft_orders/list.json`;
  
    const headers = {
      'Content-Type': 'application/json',
      'x-shopbase-access-token': 'default',
      'referer': `https://${shop}.onshopbase.com/admin/draft_orders`,
      'origin': `https://${shop}.onshopbase.com`,
      'x-sb-fp-hash': '618a0ef02626b076d3df1c412f57eefd',
      'x-sb-captcha': 'e30=',
      'Cookie': 'ajs_group_id=null; _ga=GA1.1.279936704.1743431708; _fbp=fb.1.1743431709685.850514486145181587; _hjSessionUser_1386024=eyJpZCI6IjRlYWRkYThjLTI0YTYtNTE5OS04ZWVmLTc0NGU5NTA4MTE0MiIsImNyZWF0ZWQiOjE3NDM0MzE3MTc4MzgsImV4aXN0aW5nIjp0cnVlfQ==; sb_sso=ef68bf06fd09c1fb4d320fb5ab2a54be3477a2f51b9a02a9dad07809b80bc23a; sh_ac=default; _ga=GA1.3.279936704.1743431708; hj_tc=6993176e; ajs_user_id=10656103; ajs_anonymous_id=%22b2105862-067d-42ff-ab54-aa31058b2452%22; _cioid=10656103; i18n_redirected=en; csrftoken=XR1Ak9LNMoZLwyEB8aU2cWOhFnx70H2q; X-Lang=en-vn; _gid=GA1.3.997029157.1746604660; crisp-client%2Fsession%2Ff5c7331c-510d-4a08-bf62-8c63aeeb568e=session_7619cba8-9be2-49d3-aadf-4c7f4ec6ff67; X-Buyer-AB-Test-Checked=true; auth-cookie=MTc0NjYwNDY2OHxEWDhFQVFMX2dBQUJFQUVRQUFEXzB2LUFBQUlHYzNSeWFXNW5EQk1BRVZWVFJWSmZRVU5EUlZOVFgxUlBTMFZPQm5OMGNtbHVad3hDQUVCaE1UazJORFk1TnpVMk5qRmpZamRqWVRsaVlqY3hPVFUwTVdNM09HWm1ZamRoWVdRd01qZGpZVE0wTjJOak1HTXhPVFZoWVRBMFlUWmxOekpqWTJZeUJuTjBjbWx1Wnd3VEFCRlRTRTlRWDBGRFEwVlRVMTlVVDB0RlRnWnpkSEpwYm1jTVFnQkFaV1kyT0dKbU1EWm1aREE1WXpGbVlqUmtNekl3Wm1JMVlXSXlZVFUwWW1Vek5EYzNZVEptTlRGaU9XRXdNbUU1WkdGa01EYzRNRGxpT0RCaVl6SXpZUT09fGY0dTBtiZKPKL_0GgEdUZmO1N-mNCUdukLcUaRdXt-L; _gali=app; ph_phc_Oww2eJIZyOJFKXXcHaEUZUi70qVB0Sp4J1Xnh8v8Bxa_posthog=%7B%22distinct_id%22%3A%220195eca0-a815-7c68-9708-39691de33bd0%22%2C%22%24device_id%22%3A%220195eca0-a815-7c68-9708-39691de33bd0%22%2C%22%24user_state%22%3A%22anonymous%22%2C%22%24sesid%22%3A%5B1746604702675%2C%220196a9c0-158a-7fba-9da6-96562731836a%22%2C1746604660106%5D%7D; _ga_K91SP82XV5=GS2.1.s1746604660$o7$g1$t1746604703$j0$l0$h0',
    };
  
    const data = {
      ...(query ? { ...JSON.parse(query) } : {
        search_type: "order_name",
        tab_name: "all",
        page: 1,
        limit: 50
      })
    };
    
    try {
      const response = await axios.default.post(url, data, { headers });
      return response?.data?.data?.filter((order) => order?.draft_order?.status !== "draft");
    } catch (err: any) {
      console.error('❌ [ERROR] fetchDraftOrder failed:', err.response?.status, err.response?.data);
      throw err;
    }
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

  public async updateInventoryQuantityShopbaseProduct(
    shopbaseProductId: string,
    numberOfProductToBuy: number
  ) {
    try {
      const shop = process.env.SHOP_BASE_NAME;
      const key = process.env.SHOP_BASE_KEY;
      const password = process.env.SHOP_BASE_PASSWORD;
      const token = Buffer.from(`${key}:${password}`).toString('base64');
  
      const axiosInstance = axios.default.create({
        baseURL: `https://${shop}.onshopbase.com/admin`,
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      // 1️⃣ Lấy thông tin sản phẩm
      const productResponse = await axiosInstance.get(`/products/${shopbaseProductId}.json`);
      const product = productResponse.data.product;
  
      if (!product || !product.variants || product.variants.length === 0) {
        throw new Error('No variants found for this product');
      }
      if (product) {
        console.log('🚀 [LOGGER] productdfjkalsdfjaldksfjlasdjf:', product);
        return 
      }
      const variant = product.variants[0]; // giả sử có 1 variant
      const variantId = variant.id;
      const availableQuantity = variant.inventory_quantity;
  
      if (availableQuantity < numberOfProductToBuy) {
        throw new Error('Not enough inventory available for this product');
      }
  
      const remainingQuantity = availableQuantity - numberOfProductToBuy;
  
      // 2️⃣ Cập nhật tồn kho của variant
      const updateResponse = await axiosInstance.put(`/variants/${variantId}.json`, {
        variant: {
          inventory_quantity: remainingQuantity,
        },
      });
  
      console.log('✅ [SHOPBASE] Inventory updated:', updateResponse.data);
      return updateResponse.data;
    } catch (error) {
      this.logger.error(
        `[SHOPBASE][UPDATE_INVENTORY]: Error updating inventory for product ${shopbaseProductId}`,
        error
      );
      throw new Error(
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to update ShopBase inventory'
      );
    }
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
          stockAmount: stockAmountShopBase,
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
      // const checkExistedProducts = await this.productRepository.findBy({
      //   shopBaseId: Not(IsNull()),
      // });

      // const pivot = !isEmpty(checkExistedProducts)
      //   ? new Date(Date.now() - 5 * 60 * 1000)
      //   : new Date(null);

      // const updatedAtMin = pivot.toISOString();
      // const limit = 10;
      // let sinceId = '';
      let products = [];

      const timestamp = new Date().getTime();
      this.logger.log(`[SHOP_BASE][SYNC_PRODUCT][START]`);
      // do {
      //   // const query = this.queryString(updatedAtMin, limit, sinceId);
      //   // if (products.length) {
      //     //   sinceId = products.at(-1).id;
      //     // }
          
          
          
      //   } while (products.length);
      products = await this.fetchProduct();

      const mappedProducts = this.mapProducts(products);


      for (const product of mappedProducts) {
        await this.upsertProduct(product);
      }

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
      this.logger.error('[SHOP_BASE][ERROR]: ', error);

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
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await this.syncProduct();
      await this.syncCusomer();
      
      const drafOrders: any = await this.fetchDraftOrder();

      const [users, products, systemOrders] = await Promise.all([
        this.userRepository.findBy({
          shopbaseCustomerId: Not(IsNull()),
        }),
        this.productRepository.findBy({
          shopBaseId: Not(IsNull()),
        }),
        this.orderRepository.findBy({
          source: 'shopbase',
        }),
      ]);


      const userMap = keyBy(users, 'shopbaseCustomerId');
      const productMap = keyBy(products, 'shopBaseId');
      const systemOrderMap = keyBy(systemOrders, 'shopbaseOrderId');
      
      await Bluebird.mapSeries(drafOrders, async (order: any) => {
        const {
          draft_order,
          customer_address,
          cart_items_dto,
        } = order;
        
        const {
          first_name,
          last_name,
          address1,
          address2,
          city,
        } = customer_address;
        
       const totalAmount = cart_items_dto?.reduce((acc, curr) => acc + curr?.qty, 0) || 0;
       const totalPrice = cart_items_dto?.reduce((acc, curr) => acc + curr?.variant?.price, 0) || 0;

       const currentOrder = systemOrderMap[draft_order?.id] as OrderEntity;
       // đã tồn tại order thì chỉ cập nhật trạng thái
       if (!isEmpty(currentOrder)) {
        currentOrder.status = draft_order?.status;
        currentOrder.financialStatus = draft_order?.status;
        currentOrder.fulfillmentStatus = draft_order?.status;

        console.log('🚀 [LOGGER]  [SHOP_BASE][UPDATE_ORDER]:', currentOrder?.id);

        await queryRunner.manager.save(currentOrder);
        return;
       }

       let addressOrder = "";
       if (address1?.trim()) addressOrder += address1?.trim();
        if (address2?.trim()) addressOrder += ` ${address2?.trim()}`;
        if (city?.trim()) addressOrder += ` ${city?.trim()}`;

       const userName = first_name && last_name ? `${first_name} ${last_name}` : userMap[customer_address?.customer_id]?.username;

        const orderEntity = new OrderEntity();
        orderEntity.userId = userMap[customer_address?.customer_id]?.id || null;
        orderEntity.status = draft_order?.status;
        orderEntity.financialStatus = draft_order?.status;
        orderEntity.fulfillmentStatus = draft_order?.status;
        orderEntity.totalAmount = totalAmount;
        orderEntity.totalPrice = totalPrice * VND_TO_USD;
        orderEntity.paymentType = 'shopbase_payment';
        orderEntity.receiver =  userName;
        orderEntity.phone = userMap[customer_address?.customer_id]?.phoneNumber;
        orderEntity.address = addressOrder || userMap[customer_address?.customer_id]?.address;
        orderEntity.source = 'shopbase';
        orderEntity.shopbaseOrderId = draft_order?.id;

        const orderSaved = await queryRunner.manager.save(orderEntity);
        console.log('🚀 [LOGGER]  orderSaved:', orderSaved);

        const orderDetails = cart_items_dto?.map((lineItem) => {
          const orderDetail = new OrderDetailEntity();

          orderDetail.orderId = orderSaved.id;
          orderDetail.productId = productMap[lineItem?.variant?.product_id]?.id || null;
          orderDetail.amount = lineItem?.qty || 0;
          orderDetail.unitPrice = lineItem?.variant?.price * VND_TO_USD || 0;

          return orderDetail;
        });

        await queryRunner.manager.save(orderDetails);
      })

      await queryRunner.commitTransaction();
      return new ResponseBuilder(drafOrders)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage('Đồng bộ thành công')
      .build();
      // console.log('🚀 [LOGGER] drafOrders:', drafOrders);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('[SHOPIFY_SYNC][ORDER][ERROR]: ', error);

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage('Đồng bộ đơn hàng thất bại')
        .build();
    }finally {
      await queryRunner.release();
    }
  }

  private async upsertCustomer(data: {
    shopbaseCustomerId: string;
    email: string;
    username: string;
    phone: string;
    address: string;
  }) {
    const { shopbaseCustomerId, email, phone, username, address } = data;
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
          address: address,
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
          address,
          phoneNumber: phone,
          gender: 'other',
          password: newPassword,
          source: 'shopbase',
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
      ({ email, first_name, last_name, id, phone, default_address }) => {
        return {
          shopbaseCustomerId: `${id}`,
          email,
          username: `${first_name || ''} ${last_name || ''}`,
          phone: convertToLocalPhoneNumber(phone),
          address: `${default_address?.address1 || ''} ${default_address?.address2 || ''} ${default_address?.city || ''} ${default_address?.country || ''}`,
        };
      },
    );

    return mappedCustomers;
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
          this.syncCusomer();
        } else if (key === 'product') {
          console.log('Start cron job sync product');
          this.syncProduct();
        } else if (key === 'order') {
          console.log('Start cron job sync order');
          this.syncDraftOrder();
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
