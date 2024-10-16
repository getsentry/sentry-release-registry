export interface AppEntry {
  name: string;
  canonical: string;
  version: string;
  repo_url: string;
  main_docs_url: string;
  file_urls: Record<string, string>;
  created_at: string;
  files: Record<string, { url: string; checksums?: Record<string, string> }>;
}

export type Apps = Record<string, AppEntry>;
