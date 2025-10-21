import React, { useMemo } from 'react';
import { format, startOfWeek, eachDayOfInterval, startOfYear, endOfYear, getDay } from 'date-fns';
import { PackageData } from '../types';

interface ActivityHeatmapProps {
  packages: { [key: string]: PackageData };
  selectedYear: number | null;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  packages,
  selectedYear,
}) => {
  const heatmapData = useMemo(() => {
    const year = selectedYear ?? new Date().getFullYear();
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const activityMap = new Map<string, number>();

    // Count releases per day
    for (const pkg of Object.values(packages)) {
      for (const version of pkg.versions) {
        if (!version.created_at) continue;
        const date = new Date(version.created_at);
        if (date.getFullYear() !== year) continue;
        
        const dateKey = format(date, 'yyyy-MM-dd');
        activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
      }
    }

    // Create heatmap structure
    const weeks: { day: Date; count: number }[][] = [];
    let currentWeek: { day: Date; count: number }[] = [];
    let currentWeekStart = startOfWeek(days[0], { weekStartsOn: 0 });

    for (const day of days) {
      const weekStart = startOfWeek(day, { weekStartsOn: 0 });
      
      if (weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
        currentWeekStart = weekStart;
      }

      const dateKey = format(day, 'yyyy-MM-dd');
      currentWeek.push({
        day,
        count: activityMap.get(dateKey) || 0,
      });
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const maxCount = Math.max(...Array.from(activityMap.values()), 1);

    return { weeks, maxCount };
  }, [packages, selectedYear]);

  const getColor = (count: number) => {
    if (count === 0) return '#ebedf0';
    const intensity = count / heatmapData.maxCount;
    if (intensity < 0.25) return '#9be9a8';
    if (intensity < 0.5) return '#40c463';
    if (intensity < 0.75) return '#30a14e';
    return '#216e39';
  };

  const year = selectedYear ?? new Date().getFullYear();

  return (
    <div className="activity-heatmap">
      <h2>Release Activity - {year}</h2>
      <div className="heatmap-container">
        <div className="heatmap-labels">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        <div className="heatmap-grid">
          {heatmapData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="heatmap-week">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = week.find(d => getDay(d.day) === dayIndex);
                if (!dayData) {
                  return <div key={dayIndex} className="heatmap-day empty" />;
                }
                
                return (
                  <div
                    key={dayIndex}
                    className="heatmap-day"
                    style={{ backgroundColor: getColor(dayData.count) }}
                    title={`${format(dayData.day, 'MMM d, yyyy')}: ${dayData.count} release${dayData.count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="legend-scale">
            <div style={{ backgroundColor: '#ebedf0' }} />
            <div style={{ backgroundColor: '#9be9a8' }} />
            <div style={{ backgroundColor: '#40c463' }} />
            <div style={{ backgroundColor: '#30a14e' }} />
            <div style={{ backgroundColor: '#216e39' }} />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

