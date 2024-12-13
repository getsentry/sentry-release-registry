import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { SdkEntry, Sdks, SdkVersions } from './types';
import { RegistryService } from '../common/registry.service';
import { ReleaseRegistryCacheInterceptor } from '../common/cache';
import { isTruthy } from 'src/common/utils';

@Controller('sdks')
@UseInterceptors(ReleaseRegistryCacheInterceptor)
export class SdksController {
  constructor(private registryService: RegistryService) {}

  @Get()
  getSdks(@Query('strict') strict?: string): Sdks {
    const isStrict = isTruthy(strict);
    return this.registryService.getSdks(isStrict);
  }

  @Get('/:sdkId/versions')
  getSdkVersions(@Param('sdkId') sdkId: string): SdkVersions {
    return this.registryService.getSdkVersions(sdkId);
  }

  @Get('/:sdkId/:version')
  getSdk(
    @Param('sdkId') sdkId: string,
    @Param('version') version?: string,
  ): SdkEntry {
    return this.registryService.getSdk(sdkId, version);
  }
}
