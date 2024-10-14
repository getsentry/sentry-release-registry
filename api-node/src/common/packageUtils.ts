import * as path from 'path';
import * as fs from 'fs';

export const PACKAGES_PATH = path.join('..', 'packages');

export function getPackage(packageName: string, version: string = 'latest') {
  const packageDir = getPackageDirFromCanonical(packageName);
  const versionFilePath = path.join(packageDir, `${version}.json`);
  return JSON.parse(fs.readFileSync(versionFilePath).toString());
}

export function getPackageDirFromCanonical(canonicalPackageName: string) {
  const [registry, name] = canonicalPackageName.split(/:(.*)/s);
  const pkgPath = name.replaceAll(':', path.sep).split(path.sep);
  return path.resolve(path.join(PACKAGES_PATH, registry, ...pkgPath));
}
