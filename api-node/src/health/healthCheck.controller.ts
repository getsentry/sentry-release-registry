import { Controller, Get } from '@nestjs/common';

@Controller('/healthz')
export class HealthCheckController {
  constructor() {}

  @Get()
  getHealthCheck(): string {
    return 'ok\n';
  }
}
