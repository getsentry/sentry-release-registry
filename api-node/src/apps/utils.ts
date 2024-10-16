import { AppEntry } from 'src/apps/types';

export function findDownloadUrl(
  appInfo: AppEntry,
  pkgName: string,
  arch: string,
  platform: string,
): string | null {
  const normalizedPackage = pkgName.replace(/_/g, '-').toLowerCase().split('-');
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

export function getUrlChecksums(
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

export function makeDigest(checksums: Record<string, string> | null): string {
  if (!checksums) {
    return '';
  }
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
