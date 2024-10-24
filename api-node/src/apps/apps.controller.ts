import {
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { RegistryService } from '../common/registry.service';
import { findDownloadUrl, getUrlChecksums, makeDigest } from './utils';
import type { AppEntry, Apps } from './types';
import { ReleaseRegistryCacheInterceptor } from '../common/cache';
import { AppVersionInterceptor } from './appVersion.interceptor';

@Controller('apps')
export class AppsController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  @UseInterceptors(ReleaseRegistryCacheInterceptor)
  getApps(): Apps {
    return this.registryService.getApps();
  }

  @Get(':appId/:version')
  @UseInterceptors(AppVersionInterceptor)
  getAppVersion(
    @Param('appId') appId: string,
    @Param('version') version: string,
    @Query('response') response?: string | undefined,
    @Query('arch') arch?: string | undefined,
    @Query('platform') platform?: string | undefined,
    @Query('package') pkgName?: string | undefined,
  ): AppEntry | Record<string, unknown> {
    const appInfo = this.registryService.getApp(appId, version);

    if (!appInfo) {
      throw new NotFoundException();
    }

    if (response === 'download') {
      if (!pkgName || !arch || !platform) {
        // The Flask API did this implicitly when accessing non-existing query parameters.
        // In NestJS, we have to explicitly throw a 400 error.
        throw new BadRequestException();
      }
      const url = findDownloadUrl(appInfo, pkgName, arch, platform);
      if (!url) {
        throw new NotFoundException();
      }

      const checksums = getUrlChecksums(appInfo, url);
      const digest = makeDigest(checksums);

      return { url, digest };
    }

    return appInfo;
  }
}
