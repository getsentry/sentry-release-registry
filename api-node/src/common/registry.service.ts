import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import type { SdkEntry, SdksResponse } from '../sdks/types';
import { getPackage, getPackageDirFromCanonical } from '../common/packageUtils';
import {
  MarketingSlugEntry,
  MarketingSlugResolveResponse,
  MarketingSlugResponse,
} from 'src/marketing/types';
import { AppEntry, AppsResponse } from 'src/apps/types';

const SDKS_PATH = path.join('..', 'sdks');
const APPS_PATH = path.join('..', 'apps');
const PACKAGES_PATH = path.join('..', 'packages');
const AWS_LAMBDA_LAYERS_PATH = path.join('..', 'aws-lambda-layers');

@Injectable()
export class RegistryService {
  // TODO: package types
  #packages;
  #slugs: Record<string, MarketingSlugEntry>;

  constructor() {
    this.#packages = Array.from(iterPackages());
    this.#slugs = JSON.parse(
      fs.readFileSync(path.join('..', 'misc', 'marketing-slugs.json'), 'utf8'),
    );
  }

  // SDKs
  getSdks(strict: boolean = false): SdksResponse {
    const sdks: SdksResponse = {};
    try {
      const sdkLinks = fs.readdirSync(SDKS_PATH);
      for (const link of sdkLinks) {
        try {
          const latestJsonPath = path.join(SDKS_PATH, link, 'latest.json');
          const latestJsonContent = fs.readFileSync(latestJsonPath, 'utf8');
          const { canonical } = JSON.parse(latestJsonContent);
          const pkg = getPackage(canonical);
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
      return getPackage(canonical, version);
    } catch (error) {
      console.error('Error reading SDK file:', error);
    }
  }

  getSdkVersions(sdkId: string): { latest: any; versions: string[] } {
    const latest = this.getSdk(sdkId);
    const { versions } = this.getPackageVersions(latest.canonical as string);
    return { latest, versions };
  }

  // Packages

  getPackages() {
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

  getPackageVersions(packageName: string): { latest: any; versions: string[] } {
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

  // TODO: rename to getPackage
  getPackageByVersion(packageName: string, version: string): string {
    try {
      return getPackage(packageName, version);
    } catch (e) {
      console.error(`Failed to read package by version: ${packageName}`);
      console.error(e);
    }
  }

  // Apps

  getApps(): AppsResponse {
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

  findDownloadUrl(
    appInfo: AppEntry,
    pkgName: string,
    arch: string,
    platform: string,
  ): string | null {
    const normalizedPackage = pkgName
      .replace(/_/g, '-')
      .toLowerCase()
      .split('-');
    for (const [_, url] of Object.entries(appInfo.file_urls)) {
      let normalizedUrl = url.toLowerCase();
      if (normalizedUrl.endsWith('.exe')) {
        normalizedUrl = normalizedUrl.slice(0, -4);
      }
      const parts = normalizedUrl.split('/').pop()!.split('-');
      if (
        parts.length > 2 &&
        parts.slice(0, -2).join('-') === normalizedPackage.join('-') &&
        parts[parts.length - 1].replace(/_/g, '-') ===
          arch.toLowerCase().replace(/_/g, '-') &&
        parts[parts.length - 2] === platform.toLowerCase()
      ) {
        return url;
      }
    }
    return null;
  }

  getUrlChecksums(
    appInfo: AppEntry,
    url: string,
  ): Record<string, string> | null {
    for (const fileInfo of Object.values(appInfo.files)) {
      if (fileInfo.url === url) {
        return (fileInfo as any).checksums || null;
      }
    }
    return null;
  }

  makeDigest(checksums: Record<string, string> | null): string {
    if (!checksums) return '';
    const digestParts: string[] = [];
    for (const [algo, value] of Object.entries(checksums)) {
      if (algo.endsWith('-hex')) {
        const base64Value = Buffer.from(value, 'hex').toString('base64');
        digestParts.push(`${algo.slice(0, -4)}=${base64Value}`);
      } else if (algo.endsWith('-base64')) {
        digestParts.push(`${algo.slice(0, -7)}=${value}`);
      }
    }
    return digestParts.join(',');
  }

  // Marketing

  getMarketingSlugs(): MarketingSlugResponse {
    return { slugs: Object.keys(this.#slugs) };
  }

  resolveMarketingSlug(slug: string): MarketingSlugResolveResponse | null {
    const data = this.#slugs[slug];
    if (!data) {
      return null;
    }

    let target = null;
    if (data.type === 'sdk') {
      target = this.getSdk(data.target);
    } else if (data.type === 'package') {
      target = this.getPackageByVersion(data.target, 'latest');
    } else if (data.type === 'integration') {
      let pkg = null;
      if (data.sdk) {
        pkg = this.getSdk(data.sdk);
      } else if (data.package) {
        pkg = this.getPackageByVersion(data.package, 'latest');
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

  async getAwsLambdaLayers() {
    const layers: Record<string, any> = {};
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

const NAMESPACE_FILE_MARKER = '__NAMESPACE__';

function* iterPackages() {
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
