import { Controller, Get, Param, Query, Res } from '@nestjs/common';

import { AppsResponse } from './types';

import type { Response } from 'express';
import { RegistryService } from '../registry/registry.service';

@Controller('apps')
export class AppsController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  getApps(): AppsResponse {
    return this.registryService.getApps();
  }

  @Get(':appId/:version')
  getAppVersion(
    @Res() res: Response,
    @Param('appId') appId: string,
    @Param('version') version: string,
    @Query('response') response?: string,
    @Query('arch') arch?: string,
    @Query('platform') platform?: string,
    @Query('package') pkgName?: string,
  ): void {
    const appInfo = this.registryService.getApp(appId, version);

    if (!appInfo) {
      res.status(404).send('App not found');
      return;
    }

    if (response === 'download') {
      if (!arch || !platform || !pkgName) {
        res.status(400).send('Missing required query parameters');
        return;
      }

      const url = this.registryService.findDownloadUrl(
        appInfo,
        pkgName,
        arch,
        platform,
      );
      if (!url) {
        res.status(404).send('Download URL not found');
        return;
      }

      const checksums = this.registryService.getUrlChecksums(appInfo, url);
      const digest = this.registryService.makeDigest(checksums);

      res.setHeader('Location', url);
      if (digest) {
        res.setHeader('Digest', digest);
      }
      res.status(302).send();
      return;
    }

    res.json(appInfo);
  }
}
