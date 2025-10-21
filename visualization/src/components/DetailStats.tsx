import React from 'react';
import { PackageData } from '../types';
import { calculateReleaseStats, getTimeSinceLastRelease } from '../utils/versionAnalysis';

interface DetailStatsProps {
  packageData: PackageData;
}

export const DetailStats: React.FC<DetailStatsProps> = ({ packageData }) => {
  const stats = calculateReleaseStats(packageData.versions);

  return (
    <div className="detail-stats">
      <h2>Release Statistics</h2>
      <div className="detail-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalReleases}</div>
          <div className="stat-label">Total Releases</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {stats.averageTimeBetweenReleases > 0
              ? `${Math.round(stats.averageTimeBetweenReleases)} days`
              : 'N/A'}
          </div>
          <div className="stat-label">Avg. Time Between Releases</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {getTimeSinceLastRelease(stats.timeSinceLastRelease)}
          </div>
          <div className="stat-label">Last Release</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.breakingChanges}</div>
          <div className="stat-label">Breaking Changes</div>
        </div>
      </div>

      <div className="release-cadence">
        <h3>Release Cadence</h3>
        <div className="cadence-breakdown">
          <div className="cadence-item">
            <span className="cadence-badge major">Major</span>
            <span className="cadence-count">{stats.majorVersions}</span>
          </div>
          <div className="cadence-item">
            <span className="cadence-badge minor">Minor</span>
            <span className="cadence-count">{stats.minorVersions}</span>
          </div>
          <div className="cadence-item">
            <span className="cadence-badge patch">Patch</span>
            <span className="cadence-count">{stats.patchVersions}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

