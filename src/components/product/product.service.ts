import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
// import { PaginationQuery } from '@utils/pagination.query';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '@entities/product.entity';
import { Brackets, DataSource,Repository } from 'typeorm';
import { ResponseBuilder } from '@utils/response-builder';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { BranchEntity } from '@entities/branch.entity';
import { CategoryEntity } from '@entities/category.entity';
import { ApiError } from '@utils/api.error';
import { ProductImageEntity } from '@entities/product-image.entity';
import { CloudinaryService } from '@components/cloudinary/cloudinary.service';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Bluebird from 'bluebird';
import { PRODUCT_UPLOAD_PATH, SOURCE_PRODUCT_ENUM } from './product.constant';
import { unlink } from '@utils/file';
import { escapeCharForSearch } from '@utils/common';
import { FavoriteEntity } from '@entities/favorite.entity';
import { ListProductQuery } from './dto/query/list-product.query';
import * as moment from 'moment';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,

    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,

    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,

    private readonly cloudinaryService: CloudinaryService,

    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}
  async create(request: CreateProductDto) {
    const files = request?.files || ({} as any);
    const branch = await this.branchRepository.findOneBy({
      id: request.branchId,
    });
    if (!branch) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.BRANCH_NOT_FOUND,
      ).toResponse();
    }

    const category = await this.categoryRepository.findOneBy({
      id: request.categoryId,
    });
    if (!category) {
      return new ApiError(
        ResponseCodeEnum.NOT_FOUND,
        ResponseMessageEnum.CATEGORY_NOT_FOUND,
      ).toResponse();
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const product = new ProductEntity();
      for (const [key, value] of Object.entries(request)) {
        product[key] = value;
      }
      product["sold"] = 0;

      const productEntity = this.productRepository.create(product);
      const result = await this.productRepository.save(productEntity);

      const productImages = await Bluebird.mapSeries(
        files,
        async (file: any) => {
          const productImage = new ProductImageEntity();
          productImage['productId'] = result.id;

          // Upload image to cloudinary
          const path = join(process.cwd(), file.path);
          const readFile = readFileSync(path);
          const fileUpload = { ...file, buffer: readFile };
          const uploadImage = await this.cloudinaryService.uploadImage(
            fileUpload,
            PRODUCT_UPLOAD_PATH,
          );

          await unlink(path); // Delete file after upload success

          productImage['url'] = uploadImage.secure_url;

          return productImage;
        },
      );

      const productImageEntity =
        this.productImageRepository.create(productImages);
      await this.productImageRepository.save(productImageEntity);

      await queryRunner.commitTransaction();
      return new ResponseBuilder()
        .withData(result)
        .withCode(ResponseCodeEnum.SUCCESS)
        .withMessage(ResponseMessageEnum.CREATE_SUCCESS)
        .build();
    } catch (error) {
      console.error('[PRODUCT_CREATE][ERROR]: ', error);
      await queryRunner.rollbackTransaction();

      return new ResponseBuilder()
        .withCode(ResponseCodeEnum.BAD_REQUEST)
        .withMessage(error.message)
        .build();
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(request: ListProductQuery) {
    const { page, take, skip, category, source, sort, keyword, sourceProduct, search, date } = request;

    const query = this.productRepository
      .createQueryBuilder('p')
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.slug AS slug',
        'p.description AS description',
        'p.price AS price',
        'p.sale_price AS "salePrice"',
        'p.stock_amount AS "stockAmount"',
        'p.sold AS "sold"',
        'p.shopify_id AS "shopifyId"',
        'p.shop_base_id AS "shopBaseId"',
        'p.created_at AS "createdAt"',
        'p.updated_at AS "updatedAt"',
        `JSONB_BUILD_OBJECT('id', b.id, 'name', b.name) AS branch`,
        `JSONB_BUILD_OBJECT('id', c.id, 'name', c.name) AS category`,
        `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', qb2.id, 'url', qb2.url
        )) AS "images"`,
      ])
      .leftJoin(
        (qb) =>
          qb
            .select([
              'pi.id AS id',
              'pi.product_id AS product_id',
              'pi.url AS url',
            ])
            .from(ProductImageEntity, 'pi'),
        'qb2',
        'qb2.product_id = p.id',
      )
      .leftJoin(CategoryEntity, 'c', 'c.id = p.category_id')
      .leftJoin(BranchEntity, 'b', 'b.id = p.branch_id');

    if (+category) {
      console.log(category);
      query.andWhere('p.category_id = :category', { category: +category });
    }

    if (date) {
          const startDate = moment(date).startOf('day').toDate();
          const endDate = moment(date).endOf('day').toDate();   
        
          query.andWhere('p.created_at BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          });
        }

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`lower("p"."name") LIKE lower(:pkeyWord) escape '\\'`, {
            pkeyWord: `%${escapeCharForSearch(search)}%`,
          });
        }),
      );
    }

    if (sourceProduct === 'shopify') {
      query.andWhere('p.shopify_id IS NOT NULL');
    } else if (sourceProduct === 'shopbase') {
      query.andWhere('p.shop_base_id IS NOT NULL');
    }
    if (source) {
      switch (+source) {
        case SOURCE_PRODUCT_ENUM.LOCAL:
          query.andWhere('p.shopify_id IS NULL AND p.shop_base_id IS NULL');
          break;
        case SOURCE_PRODUCT_ENUM.SHOPIFY:
          query.andWhere('p.shopify_id IS NOT NULL');
          break;
        case SOURCE_PRODUCT_ENUM.SHOPBASE:
          query.andWhere('p.shop_base_id IS NOT NULL');
          break;
      }
    }

    if (sort) {
      const [field, order] = sort.split(':');
      const orderUpper = order.toUpperCase() as 'ASC' | 'DESC';

      query.orderBy(`p.${field}`, orderUpper);
    } else {
      query.orderBy('p.id', 'DESC');
    }

    if (keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`lower("p"."name") LIKE lower(:pkeyWord) escape '\\'`, {
            pkeyWord: `%${escapeCharForSearch(keyword)}%`,
          });
        }),
      );
    }

    query.groupBy('p.id').addGroupBy('c.id').addGroupBy('b.id');
    const products = await query.limit(take).offset(skip).getRawMany();

    const number = await query.getCount();
    const pages = Math.ceil(number / take) || 1;

    const result = {
      products,
      total: number,
      page,
      pages,
      limit: take,
    };

    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async findOne(id: number) {
    const product = await this.productRepository
      .createQueryBuilder('p')
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.slug AS slug',
        'p.description AS description',
        'p.price AS price',
        'p.sale_price AS "salePrice"',
        'p.stock_amount AS "stockAmount"',
        'p.sold AS "sold"',
        'p.created_at AS "createdAt"',
        'p.updated_at AS "updatedAt"',
        `JSONB_BUILD_OBJECT('id', b.id, 'name', b.name) AS branch`,
        `JSONB_BUILD_OBJECT('id', c.id, 'name', c.name) AS category`,
        `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', qb2.id, 'url', qb2.url
      )) AS "images"`,
      ])
      .leftJoin(
        (qb) =>
          qb
            .select([
              'pi.id AS id',
              'pi.product_id AS product_id',
              'pi.url AS url',
            ])
            .from(ProductImageEntity, 'pi'),
        'qb2',
        'qb2.product_id = p.id',
      )
      .leftJoin(CategoryEntity, 'c', 'c.id = p.category_id')
      .leftJoin(BranchEntity, 'b', 'b.id = p.branch_id')
      .where('p.id = :id', { id })
      .groupBy('p.id')
      .addGroupBy('c.id')
      .addGroupBy('b.id')
      .getRawOne();

    if (!product) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    const productId  = product.id;
    const favorites = await this.favoriteRepository.find({
      where: {
        productId: productId,
      }
    })
    
    let rating = 0
    if (favorites.length > 0) {
      rating = favorites.reduce((acc, cur) => acc + cur?.rate, 0) / favorites.length;
    }
    product['rating'] = rating;

    return new ResponseBuilder()
      .withData(product)
      .withCode(ResponseCodeEnum.SUCCESS)
      .build();
  }

  async update(id: number, request: UpdateProductDto) {
    const product = await this.getProductExist(id);
    if (!product) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    for (const key in request) {
      if (key !== 'id') product[key] = request[key];
    }
    const result = await this.productRepository.save(product);
    return new ResponseBuilder()
      .withData(result)
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.UPDATE_SUCCESS)
      .build();
  }

  async remove(id: number) {
    const product = await this.getProductExist(id);
    if (!product) throw new NotFoundException(ResponseMessageEnum.NOT_FOUND);

    await this.productRepository.delete(id);

    return new ResponseBuilder()
      .withCode(ResponseCodeEnum.SUCCESS)
      .withMessage(ResponseMessageEnum.DELETE_SUCCESS)
      .build();
  }

  private async getProductExist(id: number) {
    return this.productRepository.findOne({
      where: {
        id,
      },
    });
  }
}
