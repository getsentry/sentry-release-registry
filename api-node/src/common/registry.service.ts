import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import type { SdkEntry, Sdks, SdkVersions } from '../sdks/types';
import type {
  MarketingSlugEntry,
  ResolvedMarketingSlug,
  MarketingSlugs,
} from '../marketing/types';
import type { AppEntry, Apps } from '../apps/types';
import type {
  PackageEntry,
  Packages,
  PackageVersions,
} from '../packages/types';
import type { AwsLambdaLayers } from '../aws-lambda-layers/types';

const SDKS_PATH = path.join('..', 'sdks');
const APPS_PATH = path.join('..', 'apps');
const PACKAGES_PATH = path.join('..', 'packages');
const AWS_LAMBDA_LAYERS_PATH = path.join('..', 'aws-lambda-layers');

// Some /packages sub-directories have a __NAMESPACE__ file that designates
// the directory path as a package namespace (e.g. @sentry of @sentry/browser)
const NAMESPACE_FILE_MARKER = '__NAMESPACE__';

@Injectable()
export class RegistryService {
  #packages: string[];
  #slugs: Record<string, MarketingSlugEntry>;

  constructor() {
    this.#packages = Array.from(iterPackages());
    this.#slugs = JSON.parse(
      fs.readFileSync(path.join('..', 'misc', 'marketing-slugs.json'), 'utf8'),
    );
  }

  // SDKs
  getSdks(strict: boolean = false): Sdks {
    const sdks: Sdks = {};
    try {
      const sdkLinks = fs.readdirSync(SDKS_PATH);
      for (const link of sdkLinks) {
        try {
          const latestJsonPath = path.join(SDKS_PATH, link, 'latest.json');
          const latestJsonContent = fs.readFileSync(latestJsonPath, 'utf8');
          const { canonical } = JSON.parse(latestJsonContent);
          const pkg = this.getPackage(canonical);
          if (pkg) {
            sdks[link] = pkg;
          } else if (strict) {
            throw new Error(
              `Package ${link}, canonical cannot be resolved: ${canonical}`,
            );
          }
        } catch (error) {
          if (strict) {
            throw error;
          }
          // If not strict, continue to the next SDK
        }
      }
    } catch (error) {
      console.error('Error reading SDKs directory:', error);
    }
    return sdks;
  }

  getSdk(sdkId: string, version: string = 'latest'): SdkEntry {
    const sdkFilePath = path.join(SDKS_PATH, sdkId, `${version}.json`);
    try {
      const { canonical } = JSON.parse(fs.readFileSync(sdkFilePath, 'utf8'));
      return this.getPackage(canonical, version);
    } catch (error) {
      console.error('Error reading SDK file:', error);
    }
  }

  getSdkVersions(sdkId: string): SdkVersions {
    const latest = this.getSdk(sdkId);
    const { versions } = this.getPackageVersions(latest.canonical);
    return { latest, versions };
  }

  // Packages

  getPackages(): Packages {
    return this.#packages.reduce((acc, canonical) => {
      const packageDir = getPackageDirFromCanonical(canonical);
      const latestFilePath = path.join(packageDir, 'latest.json');

      try {
        const packageInfo = JSON.parse(
          fs.readFileSync(latestFilePath).toString(),
        );
        return {
          ...acc,
          [packageInfo.canonical]: packageInfo,
        };
      } catch (e) {
        console.error(`Failed to read package: ${canonical}`);
        console.error(e);
      }
    }, {});
  }

  getPackageVersions(packageName: string): PackageVersions {
    const packageDir = getPackageDirFromCanonical(packageName);
    try {
      const versions = fs
        .readdirSync(packageDir)
        .filter((file) => file.endsWith('.json') && file !== 'latest.json')
        .map((f) => {
          const versionFile = JSON.parse(
            fs.readFileSync(path.join(packageDir, f)).toString(),
          );
          return versionFile.version;
        });

      const dedupedVersions = Array.from(new Set(versions));

      const latest = JSON.parse(
        fs.readFileSync(path.join(packageDir, 'latest.json')).toString(),
      );

      return { versions: dedupedVersions, latest };
    } catch (e) {
      console.error(`Failed to read package versions: ${packageName}`);
      console.error(e);
    }
  }

  getPackage(packageName: string, version: string = 'latest'): PackageEntry {
    try {
      const packageDir = getPackageDirFromCanonical(packageName);
      const versionFilePath = path.join(packageDir, `${version}.json`);
      return JSON.parse(fs.readFileSync(versionFilePath).toString());
    } catch (e) {
      console.error(`Failed to read package by version: ${packageName}`);
      console.error(e);
    }
  }

  // Apps

  getApps(): Apps {
    try {
      const apps = fs.readdirSync(APPS_PATH);
      return apps.reduce((acc, appName) => {
        try {
          const app = this.getApp(appName);
          if (app) {
            acc[appName] = app;
          }
        } catch {
          // Continue to next iteration if there's an error
        }
        return acc;
      }, {});
    } catch (error) {
      // Handle error (e.g., log it or throw a custom exception)
      console.error('Error reading apps directory:', error);
    }
  }

  getApp(appId: string, version: string = 'latest'): AppEntry | null {
    try {
      const filePath = path.join(APPS_PATH, appId, `${version}.json`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch {
      return null;
    }
  }

  // Marketing

  getMarketingSlugs(): MarketingSlugs {
    return { slugs: Object.keys(this.#slugs) };
  }

  resolveMarketingSlug(slug: string): ResolvedMarketingSlug | null {
    const data = this.#slugs[slug];
    if (!data) {
      return null;
    }

    let target = null;
    if (data.type === 'sdk') {
      target = this.getSdk(data.target);
    } else if (data.type === 'package') {
      target = this.getPackage(data.target, 'latest');
    } else if (data.type === 'integration') {
      let pkg = null;
      if (data.sdk) {
        pkg = this.getSdk(data.sdk);
      } else if (data.package) {
        pkg = this.getPackage(data.package, 'latest');
      }
      if (pkg) {
        target = {
          package: pkg,
          integration: data.integration,
        };
      }
    }

    return {
      definition: data,
      target,
    };
  }

  // AWS Lambda Layers

  getAwsLambdaLayers(): AwsLambdaLayers {
    const layers: AwsLambdaLayers = {};
    const lambdaLayersDir = path.resolve(AWS_LAMBDA_LAYERS_PATH);
    const runtimeDirs = fs.readdirSync(AWS_LAMBDA_LAYERS_PATH);

    try {
      for (const runtime of runtimeDirs) {
        if (fs.lstatSync(path.join(lambdaLayersDir, runtime)).isDirectory()) {
          const latestLayerFile = path.join(
            AWS_LAMBDA_LAYERS_PATH,
            runtime,
            'latest.json',
          );
          const content = fs.readFileSync(latestLayerFile, 'utf-8');
          const data = JSON.parse(content);
          layers[data.canonical] = data;
        }
      }
    } catch (error) {
      console.error('Error reading AWS Lambda Layers directory:', error);
    }

    return layers;
  }
}

function* iterPackages(): Generator<string> {
  // Loop through each package registry
  const packageRegistries = fs.readdirSync(PACKAGES_PATH);
  for (const packageRegistry of packageRegistries) {
    const registryPath = path.join(PACKAGES_PATH, packageRegistry);

    // bail if registry path is not a dir
    if (!fs.lstatSync(registryPath).isDirectory()) {
      continue;
    }

    // Loop through each item in the registry
    const items = fs.readdirSync(registryPath);
    for (const item of items) {
      const namespaceFilePath = path.join(
        PACKAGES_PATH,
        packageRegistry,
        item,
        NAMESPACE_FILE_MARKER,
      );

      // Check if the NAMESPACE_FILE_MARKER exists
      if (fs.existsSync(namespaceFilePath)) {
        const subItems = fs.readdirSync(
          path.join(PACKAGES_PATH, packageRegistry, item),
        );

        // Yield subitems, excluding NAMESPACE_FILE_MARKER
        for (const subitem of subItems) {
          if (subitem !== NAMESPACE_FILE_MARKER) {
            yield `${packageRegistry}:${item}/${subitem}`;
          }
        }
      } else {
        // Yield item if NAMESPACE_FILE_MARKER does not exist
        yield `${packageRegistry}:${item}`;
      }
    }
  }
}

function getPackageDirFromCanonical(canonicalPackageName: string): string {
  const pkgPath = canonicalPackageName
    .replaceAll(':', path.sep)
    .split(path.sep);
  return path.resolve(path.join(PACKAGES_PATH, ...pkgPath));
}
