import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('Health check')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Kiểm tra toàn bộ trạng thái hệ thống' })
  checkAll() {
    return this.healthService.checkAll();
  }

  // API kiểm tra server còn sống hay không (Liveness Probe)
  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe (Memory heap/RSS)' })
  checkLive() {
    return this.healthService.checkLiveness();
  }

  // API kiểm tra sự sẵn sàng của service & kết nối DB/Redis (Readiness Probe)
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (MongoDB & Redis connection)' })
  checkReady() {
    return this.healthService.checkReadiness();
  }
}
