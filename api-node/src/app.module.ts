import { Module } from '@nestjs/common';
import { PackagesController } from './packages/packages.controller';
import { PackagesService } from './packages/packages.service';
import { HealthCheckController } from './health/healthCheck.controller';
import { MarketingController } from './marketing/marketing.controller';
import { MarketingService } from './marketing/marketing.service';

@Module({
  imports: [],
  controllers: [HealthCheckController, PackagesController, MarketingController],
  providers: [PackagesService, MarketingService],
})
export class AppModule {}
