import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('api/me')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener resumen personalizado del usuario' })
  async getDashboard(@Request() req) {
    return this.dashboardService.getDashboard(req.usuario);
  }

  @Get('notificaciones')
  @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
  async getNotifications(@Request() req) {
    return this.dashboardService.getNotifications(req.usuario);
  }

  @Get('calendario')
  @ApiOperation({ summary: 'Obtener calendario del usuario' })
  async getCalendar(@Request() req) {
    return this.dashboardService.getCalendar(req.usuario);
  }
}
