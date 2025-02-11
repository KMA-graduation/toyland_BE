import * as querystring from 'qs';
import * as moment from 'moment';
import * as crypto from 'crypto';
import * as Bluebird from 'bluebird';
import { isEmpty, keyBy, sumBy } from 'lodash';
import { Injectable } from '@nestjs/common';
import { Connection, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { VNPay } from 'vn-payments';

import { CreateOrderDto } from './dto/request/create-order.dto';
import { UpdateOrderDto } from './dto/request/update-order.dto';
import { ListOrderQuery } from './dto/query/list-order.query';
import { OrderEntity } from '@entities/order.entity';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { ProductEntity } from '@entities/product.entity';
import { ApiError } from '@utils/api.error';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { UserEntity } from '@entities/user.entity';
import { DetailRequest } from '@utils/detail.request';
import { IsMe, OrderStatus } from './order.constant';
import { ProductImageEntity } from '@entities/product-image.entity';
import { DiscountEntity } from '@entities/discount.entity';
import { ApplyDiscountDto } from './dto/request/apply-discount.dto';
import { CheckoutOrderDto } from './dto/request/checkout-order.dto';
import { ChangeStatusOrder } from './dto/request/change-status.dto';
import { CreatePaymentDto } from './dto/request/create-payment.dto';
import { getKeyByObject } from '@utils/common';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,

    @InjectRepository(OrderDetailEntity)
    private readonly orderDetailRepository: Repository<OrderDetailEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(DiscountEntity)
    private readonly discountRepository: Repository<DiscountEntity>,

    private readonly configService: ConfigService,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async myCart(user: UserEntity) {
    const order = await this.orderRepository.findOneBy({
      userId: user.id,
      status: OrderStatus.IN_CART,
    });

    if (!order) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.NOT_FOUND,
      ).toResponse();
    }

    const orderInCart = await this.getOrderInCart(user);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .withData(orderInCart)
      .build();
  }

  async addCart(request: CreateOrderDto, user: UserEntity) {
    const orderInCart = await this.orderRepository.findOneBy({
      userId: user.id,
      status: OrderStatus.IN_CART,
    });

    if (!isEmpty(orderInCart)) {
      return await this.updateCart({ id: orderInCart.id, ...request }, user);
    }

    const productIds = request.products.map((product) => product.id);
    const products = await this.productRepository.findBy({
      id: In(productIds),
    });

    if (productIds.length !== products.length) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.NOT_FOUND,
      ).toResponse();
    }

    const orderEntity = new OrderEntity();
    orderEntity.userId = user.id;
    orderEntity.status = OrderStatus.IN_CART;
    orderEntity.totalAmount = products.length;

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.save(orderEntity);
      const orderDetail = request.products.map((product) =>
        this.orderDetailRepository.create({
          productId: product.id,
          amount: product.amount,
          orderId: order.id,
          size: product?.size,
        }),
      );

      await queryRunner.manager.save(orderDetail);
      await queryRunner.commitTransaction();

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.CREATED)
        .withMessage(ResponseMessageEnum.SUCCESS)
        .build();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(error.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(request: ListOrderQuery, user: UserEntity) {
    const { page, take, skip } = request;
    const query = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.address AS address',
        'o.phone AS phone',
        'o.note AS note',
        'o.totalPrice AS "totalPrice"',
        'o.totalAmount AS "totalAmount"',
        'o.receiver AS "receiver"',
        'o.paymentType AS "paymentType"',
        'o.created_at AS "createdAt"',
        'o.updated_at AS "updatedAt"',
        `JSON_BUILD_OBJECT('id', d.id, 'percent', d.percent, 'price', d.price) AS discount`,
        `JSON_BUILD_OBJECT('id', u.id, 'username', u.username, 'email', u.email) AS user`,
        `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'productId', qb.productId, 'productName', qb.productName,
        'unitPrice', qb.unitPrice, 'amount', qb.amount
      )) AS "orderDetails"`,
      ])
      .leftJoin(UserEntity, 'u', 'u.id = o.user_id')
      .leftJoin(DiscountEntity, 'd', 'd.id = o.discountId')
      .leftJoin(
        (qb) =>
          qb
            .select([
              'od.amount AS amount',
              'p.name AS productName',
              'p.id AS productId',
              'od.unitPrice AS unitPrice',
              'od.orderId AS orderId',
            ])
            .from(OrderDetailEntity, 'od')
            .leftJoin(ProductEntity, 'p', 'p.id = od.productId'),
        'qb',
        'qb.orderId = o.id',
      )
      .where('o.status <> :status', { status: OrderStatus.IN_CART })
      .groupBy('o.id')
      .addGroupBy('d.id')
      .addGroupBy('u.id');

    if (request.isMe === IsMe.Yes) {
      query.andWhere('o.user_id = :userId', { userId: user.id });
    }

    const [orders, number] = await Promise.all([
      query
        .orderBy('o.created_at', 'DESC')
        .limit(take)
        .offset(skip)
        .getRawMany(),
      query.getCount(),
    ]);

    const pages = Math.ceil(number / take) || 1;
    const result = {
      orders,
      total: number,
      page,
      pages,
      limit: take,
    };

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .withData(result)
      .build();
  }

  async findOne(orderId: number, user: UserEntity) {
    const order = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.address AS address',
        'o.phone AS phone',
        'o.note AS note',
        'o.totalPrice AS "totalPrice"',
        'o.totalAmount AS "totalAmount"',
        'o.receiver AS "receiver"',
        'o.paymentType AS "paymentType"',
        'o.created_at AS "createdAt"',
        'o.updated_at AS "updatedAt"',
        `JSON_BUILD_OBJECT('id', d.id, 'percent', d.percent, 'price', d.price) AS discount`,
        `JSON_BUILD_OBJECT('id', u.id, 'username', u.username, 'email', u.email) AS user`,
        `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'productId', qb.productId, 'productName', qb.productName,
        'unitPrice', qb.unitPrice, 'amount', qb.amount
      )) AS "orderDetails"`,
      ])
      .innerJoin(UserEntity, 'u', 'u.id = o.user_id')
      .leftJoin(DiscountEntity, 'd', 'd.id = o.discountId')
      .innerJoin(
        (qb) =>
          qb
            .select([
              'od.amount AS amount',
              'p.name AS productName',
              'p.id AS productId',
              'od.unitPrice AS unitPrice',
              'od.orderId AS orderId',
            ])
            .from(OrderDetailEntity, 'od')
            .innerJoin(ProductEntity, 'p', 'p.id = od.productId'),
        'qb',
        'qb.orderId = o.id',
      )
      .where('o.status <> :status', { status: OrderStatus.IN_CART })
      .andWhere('o.user_id = :userId', { userId: user.id })
      .andWhere('o.id = :orderId', { orderId })
      .groupBy('o.id')
      .addGroupBy('d.id')
      .addGroupBy('u.id')
      .getRawOne();

    if (!order) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.NOT_FOUND,
      ).toResponse();
    }
    return new ResponseBuilder(order)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .build();
  }

  async updateCart(request: UpdateOrderDto & DetailRequest, user: UserEntity) {
    const oldOrderInCart = await this.orderRepository.findOneBy({
      userId: user.id,
      status: OrderStatus.IN_CART,
    });

    const productIds = request.products.map((product) => product.id);
    const products = await this.productRepository.findBy({
      id: In(productIds),
    });

    if (products.length !== productIds.length) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.NOT_FOUND,
      ).toResponse();
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderDetailEntities = await Bluebird.mapSeries(
        request.products,
        async (product) => {
          const orderDetail = new OrderDetailEntity();
          orderDetail.productId = product.id;
          orderDetail.orderId = oldOrderInCart.id;
          orderDetail.amount = product.amount;
          orderDetail.size = product.size;

          return await this.orderDetailRepository.save(orderDetail);
        },
      );

      await queryRunner.manager.save(orderDetailEntities);
      await queryRunner.commitTransaction();

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.SUCCESS)
        .build();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(err.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  async applyDiscount(request: ApplyDiscountDto, user: UserEntity) {
    const order = await this.orderRepository.findOneBy({
      userId: user.id,
      status: OrderStatus.IN_CART,
    });

    const myCart = await this.getOrderInCart(user);
    const totalPrice = sumBy(myCart, (item) => item.price * item.amount);

    if (!order) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.ORDER_IN_CART_NOT_FOUND,
      ).toResponse();
    }

    order.totalPrice = totalPrice;
    const discount = await this.discountRepository.findOneBy({
      name: request.discountCode,
    });

    if (!discount) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.DISCOUNT_NOT_FOUND,
      ).toResponse();
    }

    const { price, percent, quantity, actualQuantity } = discount;
    if (quantity <= actualQuantity) {
      return new ApiError(
        ResponseCodeEnum.BAD_REQUEST,
        ResponseMessageEnum.DISCOUNT_EXPIRED,
      ).toResponse();
    }

    if (percent) {
      order.totalPrice = order.totalPrice - (order.totalPrice * percent) / 100;
    }

    if (price) {
      order.totalPrice = order.totalPrice - price;
    }
    //@TODO: expire discount
    order.discountId = discount.id;

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .withData(order)
      .build();
  }

  async checkout(request: CheckoutOrderDto, user: UserEntity) {
    const order = await this.orderRepository.findOneBy({
      userId: user.id,
      status: OrderStatus.IN_CART,
    });

    if (!order) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.NOT_FOUND,
      ).toResponse();
    }

    const myCart = await this.getOrderInCart(user);
    const totalPrice = sumBy(myCart, (item) => item.price * item.amount);
    const totalAmount = sumBy(myCart, (item) => item.amount);

    const orderDetails = await this.orderDetailRepository.findBy({
      orderId: order.id,
    });

    const serializedOrderDetails = keyBy(orderDetails, 'productId');

    const productIds = orderDetails.map((detail) => detail.productId);
    const products = await this.productRepository.findBy({
      id: In(productIds),
    });

    if (products.length !== productIds.length) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.ITEM_RULE_NOT_FOUND,
      ).toResponse();
    }

    const productInvalid = [];
    products.forEach((product) => {
      const detail = serializedOrderDetails[product.id];
      const isOutStock = detail.amount > product.stockAmount;
      serializedOrderDetails[product.id].unitPrice = product.price;

      if (isOutStock) {
        productInvalid.push({
          id: product.id,
          name: product.name,
        });
      }
    });

    if (!isEmpty(productInvalid)) {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(ResponseMessageEnum.INVALID_QUANTITY)
        .withData({ products: productInvalid })
        .build();
    }
    order.totalPrice = totalPrice;
    order.totalAmount = totalAmount;
    const discount = await this.discountRepository.findOneBy({
      name: request.discountCode,
    });

    if (!isEmpty(discount)) {
      const { price, percent, quantity, actualQuantity } = discount;
      if (quantity <= actualQuantity) {
        return new ApiError(
          ResponseCodeEnum.BAD_REQUEST,
          ResponseMessageEnum.DISCOUNT_EXPIRED,
        ).toResponse();
      }

      if (percent) {
        order.totalPrice =
          order.totalPrice - (order.totalPrice * percent) / 100;
      }
      if (price) {
        order.totalPrice = order.totalPrice - price;
      }
      discount.actualQuantity += 1;
      order.discountId = discount.id;
    }

    order.status = OrderStatus.WAITING_CONFIRM;
    order.paymentType = request.paymentType;
    order.phone = request.phone;
    order.receiver = request.receiver;
    order.address = request.address;
    order.note = request.note;

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(order);
      await queryRunner.manager.save(orderDetails);
      await queryRunner.manager.save(products);
      if (discount) await queryRunner.manager.save(discount);

      await queryRunner.commitTransaction();
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.SUCCESS)
        .build();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(err.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderInCart(user: UserEntity) {
    return this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id as "orderId"',
        'od.productId as "productId"',
        'p.name as "productName"',
        'od.size as size',
        'od.amount as amount',
        `CASE WHEN p.salePrice IS NOT NULL THEN (p.salePrice)::float ELSE (p.price)::float END as price`,
        `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', pi.id, 'productId', pi.productId, 'url', pi.url)) AS images`,
      ])
      .innerJoin(OrderDetailEntity, 'od', 'od.orderId = o.id')
      .innerJoin(ProductEntity, 'p', 'p.id = od.productId')
      .leftJoin(ProductImageEntity, 'pi', 'pi.productId = p.id')
      .where('o.status = :status', { status: OrderStatus.IN_CART })
      .andWhere('o.userId = :userId', { userId: user.id })
      .groupBy(
        'o.id, od.productId, p.name, p.salePrice, p.price, od.size, od.amount',
      )
      .getRawMany();
  }

  async changeStatus(
    request: ChangeStatusOrder & DetailRequest,
    user: UserEntity,
  ) {
    const query = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.address AS address',
        'o.phone AS phone',
        'o.note AS note',
        'o.totalPrice AS "totalPrice"',
        'o.totalAmount AS "totalAmount"',
        'o.receiver AS "receiver"',
        'o.paymentType AS "paymentType"',
        'o.created_at AS "createdAt"',
        'o.updated_at AS "updatedAt"',
        `JSON_BUILD_OBJECT('id', d.id, 'percent', d.percent, 'price', d.price) AS discount`,
        `JSON_BUILD_OBJECT('id', u.id, 'username', u.username, 'email', u.email) AS user`,
        `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
      'productId', qb.productId, 'productName', qb.productName,
      'unitPrice', qb.unitPrice, 'amount', qb.amount
    )) AS "orderDetails"`,
      ])
      .innerJoin(UserEntity, 'u', 'u.id = o.user_id')
      .leftJoin(DiscountEntity, 'd', 'd.id = o.discountId')
      .innerJoin(
        (qb) =>
          qb
            .select([
              'od.amount AS amount',
              'p.name AS productName',
              'p.id AS productId',
              'od.unitPrice AS unitPrice',
              'od.orderId AS orderId',
            ])
            .from(OrderDetailEntity, 'od')
            .innerJoin(ProductEntity, 'p', 'p.id = od.productId'),
        'qb',
        'qb.orderId = o.id',
      )
      .andWhere('o.id = :orderId', { orderId: request.id })
      .groupBy('o.id')
      .addGroupBy('d.id')
      .addGroupBy('u.id');

    if (request.isMe === IsMe.Yes) {
      query.andWhere('o.user_id = :userId', { userId: user.id });
    }

    const order = await query.getRawOne();

    if (isEmpty(order)) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.NOT_FOUND,
      ).toResponse();
    }

    const changedStatusOrder = await this.orderRepository.save({
      ...order,
      status: request.status,
    });

    if (request.status === OrderStatus.REJECT) {
      const productIds = getKeyByObject(order, 'productId');
      const products = await this.productRepository.findBy({
        id: In(productIds),
      });

      products.forEach((product) => {
        const detail = order.orderDetails.find(
          (item) => item.productId === product.id,
        );

        product.stockAmount += detail.amount;
      });

      await this.productRepository.save(products);
    }


    if (request.status === OrderStatus.SUCCESS) {
      const productIds = getKeyByObject(order, 'productId');
      const products = await this.productRepository.findBy({
        id: In(productIds),
      });

      products.forEach((product) => {
        const detail = order.orderDetails.find(
          (item) => item.productId === product.id,
        );

        product.stockAmount -= detail.amount;
      });

      await this.productRepository.save(products);
    }

    return new ResponseBuilder(changedStatusOrder)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .build();
  }

  async createPaymentUrl(
    request: CreatePaymentDto,
    req: any,
    user: UserEntity,
  ) {
    try {
      const { bankCode, locale } = request;
      process.env.TZ = 'Asia/Ho_Chi_Minh';
      const date = new Date();
      const createDate = moment(date).format('YYYYMMDDHHmmss');
      const ipAddr =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;

      let vnpUrl = this.configService.get('vnpay.url');
      const tmnCode = this.configService.get('vnpay.tmnCode');
      const secretKey = this.configService.get('vnpay.hashSecret');
      const returnUrl = this.configService.get('vnpay.returnUrl');

      const codeVnpay = moment(date).format('DDHHmmss');

      let order = {} as any;
      if (request.orderId) {
        order = await this.orderRepository.findOneBy({
          id: request.orderId,
          userId: user.id,
          status: OrderStatus.IN_CART,
        });
      } else {
        order = await this.orderRepository.findOneBy({
          userId: user.id,
          status: OrderStatus.IN_CART,
        });
      }

      if (!order) {
        return new ApiError(
          ResponseCodeEnum.NOT_FOUND,
          ResponseMessageEnum.ORDER_NOT_FOUND,
        ).toResponse();
      }

      const myCart = await this.getOrderInCart(user);
      const totalPrice = sumBy(myCart, (item) => item.price * item.amount);
      const totalAmount = sumBy(myCart, (item) => item.amount);

      const orderDetails = await this.orderDetailRepository.findBy({
        orderId: order.id,
      });

      const serializedOrderDetails = keyBy(orderDetails, 'productId');

      const productIds = orderDetails.map((detail) => detail.productId);
      const products = await this.productRepository.findBy({
        id: In(productIds),
      });

      if (products.length !== productIds.length) {
        return new ApiError(
          ResponseCodeEnum.NOT_FOUND,
          ResponseMessageEnum.ITEM_RULE_NOT_FOUND,
        ).toResponse();
      }

      const productInvalid = [];
      products.forEach((product) => {
        const detail = serializedOrderDetails[product.id];
        const isOutStock = detail.amount > product.stockAmount;
        serializedOrderDetails[product.id].unitPrice = product.price;

        if (isOutStock) {
          productInvalid.push({
            id: product.id,
            name: product.name,
          });
        } else {
          product['stockAmount'] -= detail.amount;
        }
      });

      if (!isEmpty(productInvalid)) {
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(ResponseMessageEnum.INVALID_QUANTITY)
          .withData({ products: productInvalid })
          .build();
      }
      order.totalPrice = totalPrice;
      order.totalAmount = totalAmount;
      const discount = await this.discountRepository.findOneBy({
        name: request.discountCode,
      });

      if (!isEmpty(discount)) {
        const { price, percent, quantity, actualQuantity } = discount;
        if (quantity <= actualQuantity) {
          return new ApiError(
            ResponseCodeEnum.BAD_REQUEST,
            ResponseMessageEnum.DISCOUNT_EXPIRED,
          ).toResponse();
        }

        if (percent) {
          order.totalPrice =
            order.totalPrice - (order.totalPrice * percent) / 100;
        }
        if (price) {
          order.totalPrice = order.totalPrice - price;
        }
        discount.actualQuantity += 1;
        order.discountId = discount.id;
      }

      order.status = OrderStatus.WAITING_PAYMENT;
      order.paymentType = 'online';
      order.phone = request.phone;
      order.receiver = request.receiver;
      order.address = request.address;
      order.note = request.note;
      order.codeVnpay = codeVnpay;

      const currCode = 'VND';
      let vnp_Params = {};
      vnp_Params['vnp_Version'] = '2.1.0';
      vnp_Params['vnp_Command'] = 'pay';
      vnp_Params['vnp_TmnCode'] = tmnCode;
      vnp_Params['vnp_Locale'] = locale;
      vnp_Params['vnp_CurrCode'] = currCode;
      vnp_Params['vnp_TxnRef'] = codeVnpay;
      vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + codeVnpay;
      vnp_Params['vnp_OrderType'] = 'other';
      vnp_Params['vnp_Amount'] = order.totalPrice * 100;
      vnp_Params['vnp_ReturnUrl'] = returnUrl;
      vnp_Params['vnp_IpAddr'] = ipAddr;
      vnp_Params['vnp_CreateDate'] = createDate;
      vnp_Params['vnp_BankCode'] = bankCode;

      vnp_Params = this.sortObject(vnp_Params);

      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
      vnp_Params['vnp_SecureHash'] = signed;
      vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

      const queryRunner = this.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager.save(order);
        await queryRunner.manager.save(orderDetails);
        await queryRunner.manager.save(products);
        if (!isEmpty(discount)) await queryRunner.manager.save(discount);

        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        return new ResponseBuilder()
          .withCode(ResponseCodeEnum.BAD_REQUEST)
          .withMessage(err.message)
          .build();
      } finally {
        await queryRunner.release();
      }

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.SUCCESS)
        .withData(vnpUrl)
        .build();
    } catch (error) {
      console.log('[ORDER][CHECKOUT_VNPAY]: ', { error });

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SERVER_ERROR)
        .withMessage(ResponseMessageEnum.SERVER_ERROR)
        .build();
    }
  }

  async vnPayReturn(request: any, res: any) {
    let vnp_Params = request;

    const secretKey = this.configService.get('vnpay.hashSecret');
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const codeVnpay = vnp_Params['vnp_TxnRef'];
      console.log('[ORDER][CHECKOUT_VNPAY][SUCCESS]: ', codeVnpay);

      await this.orderRepository.update(
        { codeVnpay },
        { status: OrderStatus.WAITING_CONFIRM },
      );

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.VNPAY_00)
        .build();
    } else {
      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(ResponseMessageEnum.VNPAY_99)
        .build();
    }
  }

  sortObject(obj) {
    const sorted = {};
    const str = [];

    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }
}
