import React from 'react';
import { PackageData, ReleaseVersion } from '../types';

interface StatsOverviewProps {
  packages: { [key: string]: PackageData };
  selectedYear: number | null;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  packages,
  selectedYear,
}) => {
  const allVersions: ReleaseVersion[] = [];
  
  for (const pkg of Object.values(packages)) {
    for (const version of pkg.versions) {
      if (selectedYear === null || 
          (version.created_at && new Date(version.created_at).getFullYear() === selectedYear)) {
        allVersions.push(version);
      }
    }
  }

  const totalPackages = Object.keys(packages).length;
  const totalReleases = allVersions.length;
  
  // Calculate average releases per package
  const avgReleasesPerPackage = totalPackages > 0 
    ? (totalReleases / totalPackages).toFixed(1) 
    : '0';

  return (
    <div className="stats-overview">
      <div className="stat-card">
        <div className="stat-value">{totalPackages}</div>
        <div className="stat-label">Packages</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{totalReleases}</div>
        <div className="stat-label">Total Releases</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{avgReleasesPerPackage}</div>
        <div className="stat-label">Avg Releases/Package</div>
      </div>
    </div>
  );
};

