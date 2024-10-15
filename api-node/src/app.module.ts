import { Module } from '@nestjs/common';
import { PackagesController } from './packages/packages.controller';
import { PackagesService } from './packages/packages.service';
import { HealthCheckController } from './health/healthCheck.controller';
import { MarketingController } from './marketing/marketing.controller';
import { MarketingService } from './marketing/marketing.service';
import { AppsController } from './apps/apps.controller';
import { AppsService } from './apps/apps.service';
import { SdksController } from './sdks/sdks.controller';
import { SdksService } from './sdks/sdks.service';
import { AwsLambdaLayersController } from './aws-lambda-layers/aws-lambda-layers.controller';
import { RegistryService } from './registry/registry.service';

@Module({
  imports: [],
  controllers: [
    HealthCheckController,
    PackagesController,
    MarketingController,
    AppsController,
    SdksController,
    AwsLambdaLayersController,
  ],
  providers: [PackagesService, MarketingService, AppsService, SdksService, RegistryService],
})
export class AppModule {}
