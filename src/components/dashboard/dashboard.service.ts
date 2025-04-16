/* eslint-disable prettier/prettier */
import * as moment from 'moment';
import { groupBy, keyBy, sumBy } from 'lodash';
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
    const { month: monthFilter, year: yearFilter } = request;
  
    const query = this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.updated_at AS "updatedAt"',
        '(o.total_price)::float AS "totalPrice"',
        `CASE WHEN COUNT(od) = 0 THEN '[]' ELSE JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'orderId', od.order_id,
          'productId', od.product_id,
          'amount', od.amount,
          'unitPrice', od.unit_price
        )) END AS "orderDetails"`,
      ])
      .leftJoin(OrderDetailEntity, 'od', 'od.order_id = o.id')
      .where('o.status = :status', { status: OrderStatus.SUCCESS });
  
    if (monthFilter && yearFilter) {
      query
        .andWhere('o.updated_at >= :startDate', {
          startDate: moment(`${yearFilter}-${monthFilter}-01`).startOf('day').toDate(),
        })
        .andWhere('o.updated_at <= :endDate', {
          endDate: moment(`${yearFilter}-${monthFilter}-01`).endOf('month').toDate(),
        });
    } else if (yearFilter) {
      query
        .andWhere('o.updated_at >= :startDate', {
          startDate: moment(`${yearFilter}-01-01`).startOf('day').toDate(),
        })
        .andWhere('o.updated_at <= :endDate', {
          endDate: moment(`${yearFilter}-12-31`).endOf('day').toDate(),
        });
    }
  
    const orders = await query.groupBy('o.id').getRawMany();
    const totalPrice = sumBy(orders, (order) => Number(order.totalPrice));
  
    // Generate chart data
    let chartData: { label: string; totalPrice: number }[] = [];
  
    if (monthFilter && yearFilter) {
      const daysInMonth = moment(`${yearFilter}-${monthFilter}`, 'YYYY-MM').daysInMonth();
      const groupedByDay = groupBy(orders, (order) => moment(order.updatedAt).format('D'));
  
      chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = (i + 1).toString();
        const list = groupedByDay[day] || [];
        return {
          label: day,
          totalPrice: sumBy(list, (item) => Number(item.totalPrice)),
        };
      });
    } else if (yearFilter) {
      const groupedByMonth = groupBy(orders, (order) => moment(order.updatedAt).format('M'));
  
      chartData = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString();
        const list = groupedByMonth[month] || [];
        return {
          label: `Tháng ${month}`,
          totalPrice: sumBy(list, (item) => Number(item.totalPrice)),
        };
      });
    } else {
      const groupedByYear = groupBy(orders, (order) => moment(order.updatedAt).format('YYYY'));
      const years = Array.from(new Set(orders.map((o) => moment(o.updatedAt).year()))).sort();
      const currentYear = moment().year();
      const minYear = years.length > 0 ? Math.min(...years) : currentYear;
  
      chartData = [];
      for (let y = minYear; y <= currentYear; y++) {
        const list = groupedByYear[y.toString()] || [];
        chartData.push({
          label: `Năm ${y}`,
          totalPrice: sumBy(list, (item) => Number(item.totalPrice)),
        });
      }
    }
  
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
    const productList = await this.productRepository.findBy({ id: In(productIds) });
    const productMap = keyBy(productList, 'id');
  
    const productDetailMap = productDetails.map((p) => ({
      ...p,
      ...productMap[p.productId],
    }));
  
    const response = plainToInstance(
      RevenueResponseDto,
      {
        revenue: totalPrice,
        revenueByMonthOfYear: chartData,
        producs: productDetailMap,
      },
      { excludeExtraneousValues: true }
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
