import { Controller, Get } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Roles } from '@decorators/roles.decorator';
import { RoleEnum } from '@enums/role.enum';
import { ShopBaseService } from './shopbase.service';

@Controller('shopbase')
export class ShopBaseController {
  constructor(private readonly shopBaseService: ShopBaseService) {}

  @Roles(RoleEnum.ADMIN)
  @Get('sync')
  // @Cron('45 * * * * *')
  // @Cron(CronExpression.EVERY_30_SECONDS)
  syncProduct() {
    return this.shopBaseService.syncProduct();
  }
}
