import { Module } from '@nestjs/common';
import { PackagesController } from './packages/packages.controller';
import { HealthCheckController } from './health/healthCheck.controller';
import { MarketingController } from './marketing/marketing.controller';
import { AppsController } from './apps/apps.controller';
import { SdksController } from './sdks/sdks.controller';
import { AwsLambdaLayersController } from './aws-lambda-layers/aws-lambda-layers.controller';
import { RegistryService } from './common/registry.service';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    SentryModule.forRoot(),
    // max and ttl taken from apiserver.py cache config
    // ttl of cache-manager@5 is in milliseconds
    CacheModule.register({ max: 200, ttl: 3600 * 1000 }),
  ],
  controllers: [
    HealthCheckController,
    PackagesController,
    MarketingController,
    AppsController,
    SdksController,
    AwsLambdaLayersController,
  ],
  providers: [
    RegistryService,
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
