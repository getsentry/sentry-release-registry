import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, eachMonthOfInterval } from 'date-fns';
import { PackageData } from '../types';

interface TimelineProps {
  packages: { [key: string]: PackageData };
  selectedPackages: string[];
  selectedYear: number | null;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#ffb347', '#a4de6c', '#d0ed57', '#ffa07a'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  // Filter out entries with zero releases
  const nonZeroPayload = payload.filter((entry: any) => entry.value > 0);

  if (nonZeroPayload.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
      {nonZeroPayload.map((entry: any, index: number) => (
        <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '14px' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  packages,
  selectedPackages,
  selectedYear,
}) => {
  const timelineData = useMemo(() => {
    // Filter packages
    const filteredPackages = selectedPackages.length > 0
      ? selectedPackages
          .filter(key => packages[key])
          .map(key => ({ key, pkg: packages[key] }))
      : Object.entries(packages).map(([key, pkg]) => ({ key, pkg }));

    if (filteredPackages.length === 0) return [];

    // Determine date range
    let minDate = new Date();
    let maxDate = new Date(0);
    
    for (const { pkg } of filteredPackages) {
      for (const version of pkg.versions) {
        if (!version.created_at) continue;
        const date = new Date(version.created_at);
        
        if (selectedYear !== null && date.getFullYear() !== selectedYear) continue;
        
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
      }
    }

    if (maxDate.getTime() === 0) return [];

    // Generate monthly buckets
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });
    const monthlyData: any[] = months.map(month => ({
      month: format(month, 'MMM yyyy'),
      date: month,
    }));

    // Count releases per month for each package
    for (const { key, pkg } of filteredPackages) {
      const monthlyCounts = new Map<string, number>();
      
      for (const version of pkg.versions) {
        if (!version.created_at) continue;
        const date = new Date(version.created_at);
        
        if (selectedYear !== null && date.getFullYear() !== selectedYear) continue;
        
        const monthKey = format(startOfMonth(date), 'MMM yyyy');
        monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);
      }

      // Add counts to monthly data
      for (const monthData of monthlyData) {
        monthData[key] = monthlyCounts.get(monthData.month) || 0;
      }
    }

    return monthlyData;
  }, [packages, selectedPackages, selectedYear]);

  const packageKeys = useMemo(() => {
    return selectedPackages.length > 0
      ? selectedPackages.filter(key => packages[key])
      : Object.keys(packages);
  }, [packages, selectedPackages]);

  if (timelineData.length === 0) {
    return (
      <div className="timeline-chart">
        <h2>Release Timeline</h2>
        <p className="no-data">No release data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="timeline-chart">
      <h2>Release Timeline</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis label={{ value: 'Number of Releases', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {packageKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              name={packages[key]?.name || key}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

