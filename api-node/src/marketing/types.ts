import { PackageEntry } from 'src/packages/types';
import { SdkEntry } from 'src/sdks/types';

export interface MarketingSlugEntry {
  type: string;
  target?: string;
  integration?: string;
  sdk?: string;
  package?: string;
}

export interface MarketingSlugs {
  slugs: string[];
}

export interface ResolvedMarketingSlug {
  definition: {
    type: string;
    target?: string;
    integration?: string;
    sdk?: string;
    package?: string;
  };
  target: SdkEntry | PackageEntry | null;
}
