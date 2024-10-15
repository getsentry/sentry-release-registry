import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  MarketingSlugEntry,
  MarketingSlugResolveResponse,
  MarketingSlugResponse,
} from './types';
import { SdksService } from '../sdks/sdks.service';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class MarketingService {
  #slugs: Record<string, MarketingSlugEntry>;

  constructor(
    private readonly sdksService: SdksService,
    private readonly packagesService: PackagesService,
  ) {
    this.#slugs = JSON.parse(
      fs.readFileSync(path.join('..', 'misc', 'marketing-slugs.json'), 'utf8'),
    );
  }

  getMarketingSlugs(): MarketingSlugResponse {
    return { slugs: Object.keys(this.#slugs) };
  }

  resolveMarketingSlug(slug: string): MarketingSlugResolveResponse | null {
    const data = this.#slugs[slug];
    if (!data) {
      return null;
    }

    let target = null;
    if (data.type === 'sdk') {
      target = this.sdksService.getSdk(data.target);
    } else if (data.type === 'package') {
      target = this.packagesService.getPackageByVersion(data.target, 'latest');
    } else if (data.type === 'integration') {
      let pkg = null;
      if (data.sdk) {
        pkg = this.sdksService.getSdk(data.sdk);
      } else if (data.package) {
        pkg = this.packagesService.getPackageByVersion(data.package, 'latest');
      }
      if (pkg) {
        target = {
          package: pkg,
          integration: data.integration,
        };
      }
    }

    return {
      definition: data,
      target,
    };
  }
}
