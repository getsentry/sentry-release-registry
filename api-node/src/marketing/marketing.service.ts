import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { MarketingSlugResponse } from './types';

@Injectable()
export class MarketingService {
  #slugs: Record<string, { type: string; target: string; integration: string }>;

  constructor() {
    this.#slugs = JSON.parse(
      fs.readFileSync(path.join('..', 'misc', 'marketing-slugs.json'), 'utf8'),
    );
  }

  getMarketingSlugs(): MarketingSlugResponse {
    return { slugs: Object.keys(this.#slugs) };
  }
}
