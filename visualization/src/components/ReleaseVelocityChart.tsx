import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PackageData } from '../types';
import { daysBetweenReleases } from '../utils/versionAnalysis';
import { format } from 'date-fns';

interface ReleaseVelocityChartProps {
  packageData: PackageData;
}

export const ReleaseVelocityChart: React.FC<ReleaseVelocityChartProps> = ({ packageData }) => {
  const chartData = React.useMemo(() => {
    const sortedVersions = [...packageData.versions]
      .filter(v => v.created_at)
      .sort((a, b) => {
        return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
      });

    const velocityData = [];
    for (let i = 1; i < sortedVersions.length; i++) {
      const current = sortedVersions[i];
      const previous = sortedVersions[i - 1];
      const days = daysBetweenReleases(current, previous);

      velocityData.push({
        date: current.created_at!,
        days,
        version: current.version,
        formattedDate: format(new Date(current.created_at!), 'MMM dd, yyyy'),
      });
    }

    return velocityData;
  }, [packageData.versions]);

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h2>Release Velocity</h2>
        <p className="no-data">Not enough data to display release velocity.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h2>Release Velocity</h2>
      <p className="chart-description">Time between consecutive releases</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="custom-tooltip">
                    <p className="tooltip-label">{data.version}</p>
                    <p className="tooltip-date">{data.formattedDate}</p>
                    <p className="tooltip-value">
                      {data.days} {data.days === 1 ? 'day' : 'days'} since previous release
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="days"
            stroke="#667eea"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Days Between Releases"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

