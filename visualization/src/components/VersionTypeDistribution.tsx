import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PackageData } from '../types';
import { calculateReleaseStats } from '../utils/versionAnalysis';

interface VersionTypeDistributionProps {
  packageData: PackageData;
}

const COLORS = {
  major: '#ef4444',
  minor: '#f59e0b',
  patch: '#10b981',
};

export const VersionTypeDistribution: React.FC<VersionTypeDistributionProps> = ({ packageData }) => {
  const stats = calculateReleaseStats(packageData.versions);

  const chartData = [
    { name: 'Major', value: stats.majorVersions, color: COLORS.major },
    { name: 'Minor', value: stats.minorVersions, color: COLORS.minor },
    { name: 'Patch', value: stats.patchVersions, color: COLORS.patch },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h2>Version Type Distribution</h2>
        <p className="no-data">No version data available.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h2>Version Type Distribution</h2>
      <p className="chart-description">
        Breakdown of major, minor, and patch releases
        {stats.breakingChanges > 0 && (
          <span className="breaking-changes-note">
            {' '}• {stats.breakingChanges} breaking {stats.breakingChanges === 1 ? 'change' : 'changes'}
          </span>
        )}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: Record<string, any>) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                return (
                  <div className="custom-tooltip">
                    <p className="tooltip-label">{data.name} Versions</p>
                    <p className="tooltip-value">
                      {data.value} {data.value === 1 ? 'release' : 'releases'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

