import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/request/create-order.dto';
import { UpdateOrderDto } from './dto/request/update-order.dto';
import { ListOrderQuery } from './dto/query/list-order.query';
import { AuthUser } from '@decorators/user.decorator';
import { UserEntity } from '@entities/user.entity';
import { DetailRequest } from '@utils/detail.request';
import { ApplyDiscountDto } from './dto/request/apply-discount.dto';
import { CheckoutOrderDto } from './dto/request/checkout-order.dto';
import { ChangeStatusOrder } from './dto/request/change-status.dto';
import { Auth } from '@decorators/auth.decorator';
import { AuthType } from '@enums/auth.enum';
import { CreatePaymentDto } from './dto/request/create-payment.dto';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/add-cart')
  addCart(@Body() request: CreateOrderDto, @AuthUser() user: UserEntity) {
    return this.orderService.addCart(request, user);
  }

  @Patch('/:id')
  updateCart(
    @Param('id') param: DetailRequest,
    @Body() request: UpdateOrderDto,
    @AuthUser() user: UserEntity,
  ) {
    return this.orderService.updateCart({ ...param, ...request }, user);
  }

  @Post('/checkout-vnpay')
  async createPaymentUrl(
    @Body() request: CreatePaymentDto,
    @Req() req: any,
    @AuthUser() user: UserEntity,
  ) {
    return await this.orderService.createPaymentUrl(request, req, user);
  }

  @Get('/vnpay-return')
  @Auth(AuthType.Public)
  async vnPayReturn(@Query() request, @Res() res: any) {
    await this.orderService.vnPayReturn(request, res);
    return res.redirect('http://localhost:5173/');
  }

  @Get('/my-cart')
  myCart(@AuthUser() user: UserEntity) {
    return this.orderService.myCart(user);
  }

  @Get('/list')
  findAll(@Query() request: ListOrderQuery, @AuthUser() user: UserEntity) {
    return this.orderService.findAll(request, user);
  }

  @Get('/:id')
  findOne(@Param('id') id: number, @AuthUser() user: UserEntity) {
    return this.orderService.findOne(id, user);
  }

  @Post('/apply-discount')
  applyDiscount(
    @Body() request: ApplyDiscountDto,
    @AuthUser() user: UserEntity,
  ) {
    return this.orderService.applyDiscount(request, user);
  }

  @Post('/checkout')
  checkout(@Body() request: CheckoutOrderDto, @AuthUser() user: UserEntity) {
    return this.orderService.checkout(request, user);
  }

  @Put('/:id/change-status')
  changeStatus(
    @Param() param: DetailRequest,
    @Body() request: ChangeStatusOrder,
    @AuthUser() user: UserEntity,
  ) {
    return this.orderService.changeStatus({ ...param, ...request }, user);
  }
}
