import { Controller, Get, Param, Query } from '@nestjs/common';
import { SdksService } from './sdks.service';
import { SdkEntry, SdksResponse, SdkVersionsResponse } from './types';

@Controller('sdks')
export class SdksController {
  constructor(private sdksService: SdksService) {}

  @Get()
  getSdks(@Query('strict') strict?: string): SdksResponse {
    const isStrict =
      strict?.toLowerCase() === 'true' || strict === '1' || strict === 'yes';
    return this.sdksService.getSdks(isStrict);
  }

  @Get('/:sdkId/versions')
  getSdkVersions(@Param('sdkId') sdkId: string): SdkVersionsResponse {
    return this.sdksService.getSdkVersions(sdkId);
  }

  @Get('/:sdkId/:version')
  getSdk(
    @Param('sdkId') sdkId: string,
    @Param('version') version?: string,
  ): SdkEntry {
    return this.sdksService.getSdk(sdkId, version);
  }
}
