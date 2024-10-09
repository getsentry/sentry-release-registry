import { Module } from '@nestjs/common';
import { PackagesController } from './packages/packages.controller';
import { PackagesService } from './packages/packages.service';
import { HealthCheckController } from './health/healthCheck.controller';

@Module({
  imports: [],
  controllers: [HealthCheckController, PackagesController],
  providers: [PackagesService],
})
export class AppModule {}
