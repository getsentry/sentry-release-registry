import { ReleaseVersion } from '../types';

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  raw: string;
}

export interface ReleaseStats {
  totalReleases: number;
  averageTimeBetweenReleases: number; // in days
  timeSinceLastRelease: number; // in days
  majorVersions: number;
  minorVersions: number;
  patchVersions: number;
  breakingChanges: number; // major version bumps
}

/**
 * Parse a version string into semantic version components
 */
export function parseSemanticVersion(version: string): SemanticVersion | null {
  if (!version) return null;

  // Handle various version formats like "1.2.3", "v1.2.3", "1.2.3-beta.1", etc.
  const versionPattern = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-.](.+))?$/;
  const match = version.match(versionPattern);

  if (!match) return null;

  return {
    major: parseInt(match[1] || '0', 10),
    minor: parseInt(match[2] || '0', 10),
    patch: parseInt(match[3] || '0', 10),
    prerelease: match[4],
    raw: version,
  };
}

/**
 * Determine version type: major, minor, or patch
 */
export function getVersionType(current: SemanticVersion, previous?: SemanticVersion): 'major' | 'minor' | 'patch' | 'initial' {
  if (!previous) return 'initial';

  if (current.major > previous.major) return 'major';
  if (current.minor > previous.minor) return 'minor';
  return 'patch';
}

/**
 * Check if a version is a major version (x.0.0)
 */
export function isMajorVersion(version: SemanticVersion): boolean {
  return version.minor === 0 && version.patch === 0;
}

/**
 * Calculate release statistics for a package
 */
export function calculateReleaseStats(versions: ReleaseVersion[]): ReleaseStats {
  const sortedVersions = [...versions].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const stats: ReleaseStats = {
    totalReleases: sortedVersions.length,
    averageTimeBetweenReleases: 0,
    timeSinceLastRelease: 0,
    majorVersions: 0,
    minorVersions: 0,
    patchVersions: 0,
    breakingChanges: 0,
  };

  if (sortedVersions.length === 0) return stats;

  // Calculate time since last release
  const latestRelease = sortedVersions[sortedVersions.length - 1];
  if (latestRelease.created_at) {
    const now = new Date();
    const lastReleaseDate = new Date(latestRelease.created_at);
    stats.timeSinceLastRelease = Math.floor(
      (now.getTime() - lastReleaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Calculate average time between releases
  if (sortedVersions.length > 1) {
    const releasesWithDates = sortedVersions.filter(v => v.created_at);
    if (releasesWithDates.length > 1) {
      const firstDate = new Date(releasesWithDates[0].created_at!);
      const lastDate = new Date(releasesWithDates[releasesWithDates.length - 1].created_at!);
      const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
      stats.averageTimeBetweenReleases = totalDays / (releasesWithDates.length - 1);
    }
  }

  // Categorize versions and count breaking changes
  let previousVersion: SemanticVersion | null = null;
  for (const version of sortedVersions) {
    const semver = parseSemanticVersion(version.version);
    if (!semver) continue;

    const versionType = getVersionType(semver, previousVersion || undefined);

    if (versionType === 'major' && previousVersion) {
      stats.breakingChanges++;
      stats.majorVersions++;
    } else if (versionType === 'minor') {
      stats.minorVersions++;
    } else if (versionType === 'patch') {
      stats.patchVersions++;
    } else if (versionType === 'initial') {
      stats.majorVersions++;
    }

    previousVersion = semver;
  }

  return stats;
}

/**
 * Get human-readable time since last release
 */
export function getTimeSinceLastRelease(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Identify releases that are breaking changes (major version bumps)
 */
export function identifyBreakingChanges(versions: ReleaseVersion[]): Set<string> {
  const sortedVersions = [...versions].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const breakingChanges = new Set<string>();
  let previousVersion: SemanticVersion | null = null;

  for (const version of sortedVersions) {
    const semver = parseSemanticVersion(version.version);
    if (!semver) continue;

    const versionType = getVersionType(semver, previousVersion || undefined);
    if (versionType === 'major' && previousVersion) {
      breakingChanges.add(version.version);
    }

    previousVersion = semver;
  }

  return breakingChanges;
}

/**
 * Calculate days between two releases
 */
export function daysBetweenReleases(current: ReleaseVersion, previous: ReleaseVersion): number {
  if (!current.created_at || !previous.created_at) return 0;
  
  const currentDate = new Date(current.created_at);
  const previousDate = new Date(previous.created_at);
  
  return Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
}

