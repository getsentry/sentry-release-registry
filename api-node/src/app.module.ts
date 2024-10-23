import { Module, Provider } from '@nestjs/common';
import { PackagesController } from './packages/packages.controller';
import { HealthCheckController } from './health/healthCheck.controller';
import { MarketingController } from './marketing/marketing.controller';
import { AppsController } from './apps/apps.controller';
import { SdksController } from './sdks/sdks.controller';
import { AwsLambdaLayersController } from './aws-lambda-layers/aws-lambda-layers.controller';
import { RegistryService } from './common/registry.service';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { CACHE_DEFAULT_SETTINGS } from './common/cache';

const providers: Provider[] = [
  RegistryService,
  { provide: APP_FILTER, useClass: SentryGlobalFilter },
];

@Module({
  imports: [
    SentryModule.forRoot(),
    CacheModule.register(CACHE_DEFAULT_SETTINGS),
  ],
  controllers: [
    HealthCheckController,
    PackagesController,
    MarketingController,
    AppsController,
    SdksController,
    AwsLambdaLayersController,
  ],
  providers,
})
export class AppModule {}
