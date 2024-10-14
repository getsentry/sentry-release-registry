export interface SdkEntry {
  name: string;
  canonical: string;
  version: string;
  // Add other fields as needed
}

export type SdksResponse = Record<string, SdkEntry>;

export interface SdkEntry {
  canonical: string;
}

export interface SdkVersionsResponse {
  latest: SdkEntry;
  versions: string[];
}
