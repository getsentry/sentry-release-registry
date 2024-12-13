export interface PackageEntry {
  name: string;
  canonical: string;
  version: string;
  repo_url: string;
  main_docs_url: string;
  created_at: string;
  package_url?: string;
  files?: Record<string, FileEntry>;
  categories?: string[];
  features?: Record<string, FeatureEntry>;
}

interface FileEntry {
  checksums: Record<string, string>;
}

interface FeatureEntry {
  availability: string | null;
  'available-with-version': string | null;
}

export interface PackageVersions {
  latest: PackageEntry;
  versions: string[];
}

export type Packages = Record<string, PackageEntry>;
