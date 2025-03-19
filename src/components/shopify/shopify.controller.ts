import { Controller, Get } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Roles(RoleEnum.ADMIN)
  @Get('sync-customer')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_10_SECONDS)
  syncCustomer() {
    return this.shopifyService.syncCustomer();
  }

  @Roles(RoleEnum.ADMIN)
  @Get('sync-product')
  // @Cron('45 * * * * *')
  @Cron(CronExpression.EVERY_5_MINUTES)
  syncProduct() {
    return this.shopifyService.syncProduct();
  }

  @Roles(RoleEnum.ADMIN)
  @Get('sync-order')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_10_SECONDS)
  syncOrder() {
    return this.shopifyService.syncOrder();
  }
}
