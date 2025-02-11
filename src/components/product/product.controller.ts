import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQuery } from '@utils/pagination.query';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  PRODUCT_UPLOAD_FIELD,
  PRODUCT_UPLOAD_FILE_TYPES,
  PRODUCT_UPLOAD_LIMIT_IMAGES,
  PRODUCT_UPLOAD_PATH,
} from './product.constant';
import { setUploadOptions } from '@config/multer.config';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';
import { FileUpload } from './dto/file';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles(RoleEnum.ADMIN)
  @Post()
  @UseInterceptors(
    FilesInterceptor(
      PRODUCT_UPLOAD_FIELD,
      PRODUCT_UPLOAD_LIMIT_IMAGES,
      setUploadOptions(PRODUCT_UPLOAD_PATH, PRODUCT_UPLOAD_FILE_TYPES),
    ),
  )
  async create(
    @Body() request: CreateProductDto,
    @UploadedFiles() fileUpload: Array<Express.Multer.File>,
  ) {
    request.files = fileUpload;
    return this.productService.create(request);
  }

  @Get()
  @Auth(AuthType.Public)
  findAll(@Query() request: PaginationQuery) {
    return this.productService.findAll(request);
  }

  @Get('/:id')
  @Auth(AuthType.Public)
  findOne(@Param('id') id: number) {
    return this.productService.findOne(id);
  }

  @Roles(RoleEnum.ADMIN)
  @Patch('/:id')
  update(@Param('id') id: number, @Body() request: UpdateProductDto) {
    return this.productService.update(id, request);
  }

  @Roles(RoleEnum.ADMIN)
  @Delete('/:id')
  remove(@Param('id') id: number) {
    return this.productService.remove(id);
  }
}
