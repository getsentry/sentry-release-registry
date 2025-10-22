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
  
  // Calculate average releases per week
  const calculateAvgReleasesPerWeek = () => {
    if (allVersions.length === 0) return '0';
    
    const dates = allVersions
      .map(v => v.created_at)
      .filter((date): date is string => date !== undefined)
      .map(date => new Date(date).getTime())
      .filter(time => !isNaN(time));
    
    if (dates.length === 0) return '0';
    
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daysDifference = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const weeks = Math.max(1, daysDifference / 7);
    
    return (totalReleases / weeks).toFixed(1);
  };
  
  const avgReleasesPerWeek = calculateAvgReleasesPerWeek();

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
        <div className="stat-value">{avgReleasesPerWeek}</div>
        <div className="stat-label">Avg Releases/Week</div>
      </div>
    </div>
  );
};

