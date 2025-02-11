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
import { VND_TO_USD } from '@utils/common';

@Injectable()
export class ShopBaseService {
  private readonly logger = new Logger(ShopBaseService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,

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

      const product = new ProductEntity();
      const decodeDescription = decode(data?.body_html);
      product.shopBaseId = data?.shop_base_id;
      product.name = data?.title;
      product.description = decodeDescription.replace(/<[^>]+>/g, '');

      const price = data?.variants?.[0]?.price || 0;
      product.price = price * VND_TO_USD;

      const stockAmountShopBase = data?.variants?.[0]?.inventory_quantity || 0;
      product.stockAmount = stockAmountShopBase;

      if (existedProduct) {
        product.id = existedProduct.id;

        if (Number(stockAmountShopBase) > existedProduct.stockAmount) {
          product.stockAmount = existedProduct.stockAmount;
        }

        await queryRunner.manager.delete(ProductImageEntity, {
          productId: existedProduct.id,
        });

        this.logger.log(
          `[SHOP_BASE][UPDATE_PRODUCT]: shop_base_id: ${data.shop_base_id}`,
        );
      } else {
        this.logger.log(
          `[SHOP_BASE][CREATE_PRODUCT]: shop_base_id${data.shop_base_id}`,
        );
      }

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
      console.error('[SHOP_BASE][CREATE_PRODUCT][ERROR]:', { error });
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
}
