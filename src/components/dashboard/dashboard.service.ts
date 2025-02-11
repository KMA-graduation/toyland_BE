/* eslint-disable prettier/prettier */
import * as moment from 'moment';
import { keyBy, sumBy } from 'lodash';
import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';

import { OrderStatus } from '@components/order/order.constant';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { OrderEntity } from '@entities/order.entity';
import { ProductEntity } from '@entities/product.entity';
import { UserEntity } from '@entities/user.entity';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { RevenueDto } from './dto/revenue.dto';
import { sumByKeys } from '@utils/common';
import { RevenueResponseDto } from './dto/revenue.response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,

    @InjectRepository(OrderDetailEntity)
    private readonly orderDetailRepository: Repository<OrderDetailEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async revenue(request: RevenueDto) {
    let { startDate, endDate } = request;
    startDate = startDate ? startDate : moment().startOf('years').toDate();
    endDate = endDate ? endDate : moment().endOf('years').toDate();

    const query = this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.updated_at AS "updatedAt"',
        '(o.total_price)::float AS "totalPrice"',
        `CASE WHEN count(od) = 0 THEN '[]' ELSE JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
                                                                          'orderId', od.order_id,
                                                                          'productId', od.product_id,
                                                                          'amount', od.amount,
                                                                          'unitPrice', od.unit_price
        )) END AS "orderDetails"`,
      ])
      .leftJoin(OrderDetailEntity, 'od', 'od.order_id = o.id')
      .where('o.status = :status', { status: OrderStatus.SUCCESS });

    if (startDate) {
      query.andWhere('o.updated_at >= :startDate', {
        startDate: moment(startDate).startOf('day').toDate(),
      });
    }

    if (endDate) {
      query.andWhere('o.updated_at <= :endDate', {
        endDate: moment(endDate).endOf('day').toDate(),
      });
    }

    const orders = await query.groupBy('o.id').getRawMany();
    orders.forEach((order) => {
      const { updatedAt } = order;
      const month = Number(moment(updatedAt).format('M'));
      const year = Number(moment(updatedAt).format('YYYY'));

      order['month'] = month;
      order['year'] = year;
      order['monthYear'] = `${month}/${year}`;
    });

    const sumByMonthYear = sumByKeys(orders, {
      keys: ['monthYear'],
      quantityFields: ['totalPrice'],
    });

    const keySumByMonthYear = keyBy(sumByMonthYear, 'monthYear');

    const months = 12;
    const currentYear = new Date().getFullYear();
    const chart = [];
    for (let month = 1; month <= months; month++) {
      const monthYear = `${month}/${currentYear}`;
      const total = keySumByMonthYear[monthYear]?.totalPrice || 0;
      const oneMilion = 1000000;

      chart.push({
        month,
        year: currentYear,
        monthYear,
        totalPrice: Number(Number(total / oneMilion).toFixed(2)),
      });
    }

    const totalPrice = sumBy(orders, (order) => Number(order.totalPrice));

    const productDetails = await this.orderDetailRepository
      .createQueryBuilder('od')
      .select([
        'od.product_id AS "productId"',
        'COUNT(od.product_id)::float AS "totalAmount"',
      ])
      .groupBy('od.product_id')
      .orderBy('COUNT(od.product_id)', 'DESC')
      .getRawMany();

    const productIds = productDetails.map((p) => p.productId);
    const productList = await this.productRepository.findBy({
      id: In(productIds),
    });

    const productMap = keyBy(productList, 'id');

    const productDetailMap = productDetails.map((p) => {
      return {
        ...p,
        ...productMap[p.productId],
      };
    });

    const response = plainToInstance(
      RevenueResponseDto,
      {
        revenue: totalPrice,
        revenueByMonthOfYear: chart,
        producs: productDetailMap,
      },
      {
        excludeExtraneousValues: true,
      },
    );

    return new ResponseBuilder(response)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .build();
  }

  async customer() {
    const users = await this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id AS id',
        'u.username AS username',
        'u.email AS email',
        'SUM(qb.money) AS money',
      ])
      .innerJoin(
        (qb) => {
          return qb
            .select([
              'o.user_id AS user_id',
              'SUM(o.total_amount * o.total_price) AS money',
            ])
            .from(OrderEntity, 'o')
            .where('o.status = :status', { status: OrderStatus.SUCCESS })
            .groupBy('o.user_id');
        },
        'qb',
        'qb.user_id = u.id',
      )
      .groupBy('u.id')
      .orderBy('SUM(qb.money)', 'DESC')
      .getRawMany();

    return new ResponseBuilder({
      users,
    })
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.SUCCESS)
      .build();
  }
}
