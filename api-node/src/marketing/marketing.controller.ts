import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { MarketingSlugs, ResolvedMarketingSlug } from './types';
import { RegistryService } from '../common/registry.service';
import { ReleaseRegistryCacheInterceptor } from '../common/cache';

@Controller('marketing-slugs')
@UseInterceptors(ReleaseRegistryCacheInterceptor)
export class MarketingController {
  constructor(private readonly registryService: RegistryService) {}

  @Get()
  getMarketingSlugs(): MarketingSlugs {
    return this.registryService.getMarketingSlugs();
  }

  @Get(':slug')
  resolveMarketingSlug(@Param('slug') slug: string): ResolvedMarketingSlug {
    const result = this.registryService.resolveMarketingSlug(slug);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }
}
