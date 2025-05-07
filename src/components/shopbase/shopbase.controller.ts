import { Body, Controller, Get, Post } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';
import { ShopBaseService } from './shopbase.service';
import { UpdateCronJobDto } from '@components/shopify/dto/update-cronjob.dto';

@Controller('shopbase')
export class ShopBaseController {
  constructor(private readonly shopBaseService: ShopBaseService) {}

   @Roles(RoleEnum.ADMIN)
    @Post('update-cron')
    updateCron(@Body() updateCronJobDto: UpdateCronJobDto) {
      return this.shopBaseService.updateCron(updateCronJobDto);
    }

  @Roles(RoleEnum.ADMIN)
  @Get('sync-product')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_30_SECONDS)
  syncProduct() {
    return this.shopBaseService.syncProduct();
  }

  @Roles(RoleEnum.ADMIN)
  @Get('sync-customer')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_30_SECONDS)
  syncCustomer() {
    return this.shopBaseService.syncCusomer();
  }

  @Roles(RoleEnum.ADMIN)
  @Get('sync-order')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_30_SECONDS)
  syncDraftOrder() {
    return this.shopBaseService.syncDraftOrder();
  }
}
