import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
@RequirePermissions('dashboard.read')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // Rutas públicas del Inicio (/): @RequirePermissions() vacío anula el
  // permiso de clase 'dashboard.read' solo para estos dos métodos — el
  // resto del controller sigue exigiendo sesión + permiso sin cambios.
  @Public()
  @RequirePermissions()
  @Get('public/innovation-summary')
  getPublicSummary() {
    return this.service.getPublicSummary();
  }

  @Public()
  @RequirePermissions()
  @Get('public/innovation-activity')
  getPublicActivity() {
    return this.service.getPublicActivity();
  }

  @Get('overview')
  @RequireModule('dashboard')
  getOverview() {
    return this.service.getOverview();
  }

  @Get('executive')
  @RequireModule('executive')
  getExecutiveOverview() {
    return this.service.getExecutiveOverview();
  }
}
