import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { MarketingSlugResponse, MarketingSlugResolveResponse } from './types';

@Controller('marketing-slugs')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  getMarketingSlugs(): MarketingSlugResponse {
    return this.marketingService.getMarketingSlugs();
  }

  @Get(':slug')
  resolveMarketingSlug(
    @Param('slug') slug: string,
  ): MarketingSlugResolveResponse {
    const result = this.marketingService.resolveMarketingSlug(slug);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }
}
