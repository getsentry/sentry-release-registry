export interface MarketingSlugEntry {
  type: string;
  target?: string;
  integration?: string;
  sdk?: string;
  package?: string;
}

export interface MarketingSlugResponse {
  slugs: string[];
}

export interface MarketingSlugResolveResponse {
  definition: {
    type: string;
    target?: string;
    integration?: string;
    sdk?: string;
    package?: string;
  };
  target: any;
}
