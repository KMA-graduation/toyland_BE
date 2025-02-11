import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RevenueDto } from './dto/revenue.dto';
import { RoleEnum } from '@enums/role.enum';
import { Roles } from '@decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Roles(RoleEnum.ADMIN)
  @Get('/revenue')
  revenue(@Query() request: RevenueDto) {
    return this.dashboardService.revenue(request);
  }

  @Roles(RoleEnum.ADMIN)
  @Get('/customers')
  customer() {
    return this.dashboardService.customer();
  }
}
