export interface AwsLambdaLayerEntry {
  name: string;
  repo_url: string;
  main_docs_url: string;
  created_at?: string;
  canonical: string;
  sdk_version: string;
  account_number: string;
  layer_name: string;
  regions: { region: string; version: string }[];
}

export type AwsLambdaLayers = Record<string, AwsLambdaLayerEntry>;
