import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
@RequirePermissions('dashboard.read')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }

  @Get('executive')
  getExecutiveOverview() {
    return this.service.getExecutiveOverview();
  }
}
