import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PackagesService {
  #packages: string[];

  constructor() {
    this.#packages = Array.from(iterPackages());
  }

  getPackages() {
    return this.#packages.reduce((acc, canonical) => {
      const packageDir = getPackageDir(canonical);
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
    const packageDir = getPackageDir(packageName);
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

  getPackageByVersion(packageName: string, version: string): string {
    const packageDir = getPackageDir(packageName);
    const versionFilePath = path.join(packageDir, `${version}.json`);

    try {
      return JSON.parse(fs.readFileSync(versionFilePath).toString());
    } catch (e) {
      console.error(`Failed to read package by version: ${packageName}`);
      console.error(e);
    }
  }
}

const NAMESPACE_FILE_MARKER = '__NAMESPACE__';

function getPackageDir(canonicalPackageName: string) {
  const [registry, name] = canonicalPackageName.split(':', 2);
  const pkgPath = name.replace(':', path.sep).split(path.sep);
  return path.resolve(path.join('..', 'packages', registry, ...pkgPath));
}

function* iterPackages() {
  const packagesPath = '../packages';

  // Loop through each package registry
  const packageRegistries = fs.readdirSync(packagesPath);
  for (const packageRegistry of packageRegistries) {
    const registryPath = path.join(packagesPath, packageRegistry);

    // bail if registry path is not a dir
    if (!fs.lstatSync(registryPath).isDirectory()) {
      continue;
    }

    // Loop through each item in the registry
    const items = fs.readdirSync(registryPath);
    for (const item of items) {
      const namespaceFilePath = path.join(
        packagesPath,
        packageRegistry,
        item,
        NAMESPACE_FILE_MARKER,
      );

      // Check if the NAMESPACE_FILE_MARKER exists
      if (fs.existsSync(namespaceFilePath)) {
        const subItems = fs.readdirSync(
          path.join(packagesPath, packageRegistry, item),
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
