import React from 'react';

interface YearSelectorProps {
  years: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onYearChange,
}) => {
  return (
    <div className="year-selector">
      <label htmlFor="year-select">Filter by Year:</label>
      <select
        id="year-select"
        value={selectedYear ?? 'all'}
        onChange={(e) => {
          const value = e.target.value;
          onYearChange(value === 'all' ? null : parseInt(value, 10));
        }}
      >
        <option value="all">All Time</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

