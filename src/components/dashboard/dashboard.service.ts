/* eslint-disable prettier/prettier */
import * as moment from 'moment';
import { groupBy, keyBy, sumBy } from 'lodash';
import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';

import { OrderShopbaseStatus, OrderShopifyStatus, OrderStatus } from '@components/order/order.constant';
import { OrderDetailEntity } from '@entities/order-detail.entity';
import { OrderEntity } from '@entities/order.entity';
import { ProductEntity } from '@entities/product.entity';
import { UserEntity } from '@entities/user.entity';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { ResponseBuilder } from '@utils/response-builder';
import { RevenueDto } from './dto/revenue.dto';
// import { sumByKeys } from '@utils/common';
import { RevenueResponseDto } from './dto/revenue.response.dto';
// import { ProductImageEntity } from '@entities/product-image.entity';
import { CategoryEntity } from '@entities/category.entity';
// import { BranchEntity } from '@entities/branch.entity';

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

    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async revenue(request: RevenueDto) {
    const { month: monthFilter, year: yearFilter, source } = request;
  
    const query = this.orderRepository
      .createQueryBuilder('o')
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.updated_at AS "updatedAt"',
        'o.created_at AS "createdAt"',
        'o.shopify_order_id AS "shopifyOrderId"',
        'o.shopbase_order_id AS "shopbaseOrderId"',
        'o.source AS source',
        '(o.total_price)::float AS "totalPrice"',
        `CASE WHEN COUNT(od) = 0 THEN '[]' ELSE JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'orderId', od.order_id,
          'productId', od.product_id,
          'amount', od.amount,
          'unitPrice', od.unit_price
        )) END AS "orderDetails"`,
      ])
      .leftJoin(OrderDetailEntity, 'od', 'od.order_id = o.id')
      .where('o.status IN (:...statuses)', { statuses: [OrderStatus.SUCCESS, OrderShopifyStatus.PAID, OrderShopbaseStatus.INVOICE_SENT] })
  
    // Filter by date
    if (monthFilter && yearFilter) {
      query
        .andWhere('o.created_at >= :startDate', {
          startDate: moment(`${yearFilter}-${monthFilter}-01`).startOf('day').toDate(),
        })
        .andWhere('o.created_at <= :endDate', {
          endDate: moment(`${yearFilter}-${monthFilter}-01`).endOf('month').toDate(),
        });
    } else if (yearFilter) {
      query
        .andWhere('o.created_at >= :startDate', {
          startDate: moment(`${yearFilter}-01-01`).startOf('day').toDate(),
        })
        .andWhere('o.created_at <= :endDate', {
          endDate: moment(`${yearFilter}-12-31`).endOf('day').toDate(),
        });
    }

    // Filter by source
    if (["shopify", "shopbase"].includes(source)) {
      query.andWhere('o.source = :source', { source });
    } else if (source) {
      query.andWhere("(o.source IS NULL OR (o.source != 'shopify' AND o.source != 'shopbase'))");
    }

    const orders = await query.groupBy('o.id').getRawMany();

    // ====== DATA STATISTICS ======
    // Calculate total price (sum of all orders, sum of order from shopify and shopbase)
    const totalShopifyPrice = sumBy(orders, (order) =>
      order.shopifyOrderId ? Number(order.totalPrice) : 0,
    );
    const totalShopbasePrice = sumBy(orders, (order) =>
      order.shopbaseOrderId ? Number(order.totalPrice) : 0,
    );
    const totalLocalShopPrice = sumBy(orders, (order) =>
      order.shopifyOrderId || order.shopbaseOrderId ? 0 : Number(order.totalPrice),
    );
    const totalPrice = sumBy(orders, (order) => Number(order.totalPrice));
    const totalOrder = orders.length;
    const totalOrderShopify = orders.filter((order) => order.shopifyOrderId).length;
    const totalOrderShopbase = orders.filter((order) => order.shopbaseOrderId).length;
    const totalOrderLocalShop = orders.filter((order) => !order.shopifyOrderId && !order.shopbaseOrderId).length;

    // ===== DATA CHART =====
    let chartData: { label: string; totalPrice: number }[] = [];
  
    if (monthFilter && yearFilter) {
      const daysInMonth = moment(`${yearFilter}-${monthFilter}`, 'YYYY-MM').daysInMonth();
      const groupedByDay = groupBy(orders, (order) => moment(order.createdAt).format('D'));
  
      chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = (i + 1).toString();
        const list = groupedByDay[day] || [];
        return {
          label: day,
          totalPrice: sumBy(list, (item) => Number(item.totalPrice)),
        };
      });
    } else if (yearFilter) {
      const groupedByMonth = groupBy(orders, (order) => moment(order.createdAt).format('M'));
  
      chartData = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString();
        const list = groupedByMonth[month] || [];
        return {
          label: `Tháng ${month}`,
          totalPrice: sumBy(list, (item) => Number(item.totalPrice)),
        };
      });
    } else {
      const groupedByYear = groupBy(orders, (order) => moment(order.createdAt).format('YYYY'));
      const years = Array.from(new Set(orders.map((o) => moment(o.createdAt).year()))).sort();
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

    

    // ====== Lấy danh sách sản phẩm đã bán ======
    const topProductQuery = this.orderDetailRepository
    .createQueryBuilder('od')
    .innerJoin('orders', 'o', 'o.id = od.order_id')
    .select([
      'od.product_id AS "productId"',
      'SUM(od.amount)::float AS "totalAmount"',
    ])
    .where('o.status IN (:...statuses)', {
      statuses: [OrderStatus.SUCCESS, OrderShopifyStatus.PAID, OrderShopbaseStatus.INVOICE_SENT],
    })
    .groupBy('od.product_id')
    .orderBy('SUM(od.amount)', 'DESC')

    // Filter by date
    if (monthFilter && yearFilter) {
      topProductQuery
        .andWhere('o.created_at >= :startDate', {
          startDate: moment(`${yearFilter}-${monthFilter}-01`).startOf('day').toDate(),
        })
        .andWhere('o.created_at <= :endDate', {
          endDate: moment(`${yearFilter}-${monthFilter}-01`).endOf('month').toDate(),
        });
    } else if (yearFilter) {
      topProductQuery
        .andWhere('o.created_at >= :startDate', {
          startDate: moment(`${yearFilter}-01-01`).startOf('day').toDate(),
        })
        .andWhere('o.created_at <= :endDate', {
          endDate: moment(`${yearFilter}-12-31`).endOf('day').toDate(),
        });
    }

    // Filter by source
    if (['shopify', 'shopbase'].includes(source)) {
      topProductQuery.andWhere('o.source = :source', { source });
    } else if (source) {
      topProductQuery.andWhere("(o.source IS NULL OR (o.source != 'shopify' AND o.source != 'shopbase'))");
    }

    const productDetails = await topProductQuery.getRawMany();

    const categories = await this.categoryRepository.find();
    const serializedCategoriesId = keyBy(categories, 'id');

    const productIds = productDetails.map((p) => p.productId);
    const productList = await this.productRepository.findBy({ id: In(productIds) });
    const productMap = keyBy(productList, 'id');
  
    // ===== DATA TABLE =====
    const productDetailMap = productDetails.map((p) => {
      return ({
        ...p,
        ...productMap[p.productId],        
        category: serializedCategoriesId[productMap[p.productId].categoryId],                                                                                                             
      })
    });

    // ===== DATA PIE CHART ===== Tính tổng doanh thu đã bán theo từng category
    // Lấy tất cả category có trong DB
    // với mỗi category, thì lấy danh sách sản phẩm ở bên trên theo từng category
    // tính tổng doanh thu của từng sản phẩm theo từng category
    const categoryRevenue = categories.map((category) => {
        const productsInCategory = productDetailMap.filter((product) => product.categoryId === category.id);
        const totalRevenue = sumBy(productsInCategory, (product) => product.totalAmount * product.price);
        return {
          categoryId: category.id,
          categoryName: category.name,
          totalRevenue: totalRevenue || 0,
        };
      }
    );

    const response = plainToInstance(
      RevenueResponseDto,
      {
        totalShopifyPrice,
        totalShopbasePrice,
        totalLocalShopPrice,
        revenue: totalPrice,
        totalOrder,
        totalOrderShopify,
        totalOrderShopbase,
        totalOrderLocalShop,
        revenueByMonthOfYear: chartData,
        producs: productDetailMap,
        categoryRevenue,
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
