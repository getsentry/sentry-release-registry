import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { MarketingSlugResponse, MarketingSlugResolveResponse } from './types';
import { RegistryService } from '../common/registry.service';

@Controller('marketing-slugs')
export class MarketingController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  getMarketingSlugs(): MarketingSlugResponse {
    return this.registryService.getMarketingSlugs();
  }

  @Get(':slug')
  resolveMarketingSlug(
    @Param('slug') slug: string,
  ): MarketingSlugResolveResponse {
    const result = this.registryService.resolveMarketingSlug(slug);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }
}
