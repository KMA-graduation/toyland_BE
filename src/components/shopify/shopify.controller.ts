import { Controller, Get } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Roles(RoleEnum.ADMIN)
  @Get('sync')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_10_SECONDS)
  syncProduct() {
    return this.shopifyService.syncProduct();
  }
}
