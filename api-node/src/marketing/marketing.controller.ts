import { Controller, Get, Param } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { MarketingSlugResponse } from './types';

@Controller('marketing-slugs')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  getMarketingSlugs(): MarketingSlugResponse {
    return this.marketingService.getMarketingSlugs();
  }

  @Get(':slug')
  resolveMarketingSlug(@Param('slug') slug: string): string {
    // TODO: This needs to be implemented but we need other functionality first
    // return this.marketingService.resolveMarketingSlug(slug);
    return 'ok';
  }
}
