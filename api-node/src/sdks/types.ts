export interface SdkEntry {
  name: string;
  canonical: string;
  version: string;
  // Add other fields as needed
}

export type Sdks = Record<string, SdkEntry>;

export interface SdkEntry {
  canonical: string;
}

export interface SdkVersions {
  latest: SdkEntry;
  versions: string[];
}
