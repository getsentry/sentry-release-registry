export interface ReleaseVersion {
  version: string;
  created_at: string;
  name: string;
  canonical: string;
  repo_url?: string;
  main_docs_url?: string;
  package_url?: string;
}

export interface PackageData {
  name: string;
  canonical: string;
  versions: ReleaseVersion[];
  latestVersion?: ReleaseVersion;
}

export interface RegistryData {
  apps: {
    [appName: string]: PackageData;
  };
  packages: {
    [registry: string]: {
      [packageName: string]: PackageData;
    };
  };
  years: number[];
}

export interface TimelineDataPoint {
  date: string;
  count: number;
  versions: string[];
}

export interface HeatmapDataPoint {
  date: string;
  count: number;
}

