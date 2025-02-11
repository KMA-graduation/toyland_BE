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
import { log } from 'console';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,

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
}
