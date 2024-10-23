import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ReleaseRegistryCacheInterceptor } from '../common/cache';

@Controller('/healthz')
@UseInterceptors(ReleaseRegistryCacheInterceptor)
export class HealthCheckController {
  constructor() {}

  @Get()
  getHealthCheck(): string {
    return 'ok\n';
  }
}
