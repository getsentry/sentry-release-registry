import { Controller, Get, Param, Query } from '@nestjs/common';
import { SdkEntry, SdksResponse, SdkVersionsResponse } from './types';
import { RegistryService } from '../common/registry.service';

@Controller('sdks')
export class SdksController {
  constructor(private registryService: RegistryService) {}

  @Get()
  getSdks(@Query('strict') strict?: string): SdksResponse {
    const isStrict =
      strict?.toLowerCase() === 'true' || strict === '1' || strict === 'yes';
    return this.registryService.getSdks(isStrict);
  }

  @Get('/:sdkId/versions')
  getSdkVersions(@Param('sdkId') sdkId: string): SdkVersionsResponse {
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
