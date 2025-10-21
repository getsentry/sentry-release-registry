import { useState, useEffect, useMemo } from 'react';
import { RegistryData, PackageData } from './types';
import { loadRegistryData } from './utils/dataLoader';
import { YearSelector } from './components/YearSelector';
import { PackageSelector } from './components/PackageSelector';
import { StatsOverview } from './components/StatsOverview';
import { LatestVersions } from './components/LatestVersions';
import { Timeline } from './components/Timeline';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import './App.css';

function App() {
  const [data, setData] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'apps' | 'sdks'>('apps');
  const [selectedRegistry, setSelectedRegistry] = useState<string>('npm');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

  useEffect(() => {
    loadRegistryData()
      .then((registryData) => {
        setData(registryData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Get available registries
  const availableRegistries = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.packages).sort();
  }, [data]);

  // Get current packages based on mode and registry
  const currentPackages = useMemo((): { [key: string]: PackageData } => {
    if (!data) return {};
    
    if (mode === 'apps') {
      return data.apps;
    } else {
      return data.packages[selectedRegistry] || {};
    }
  }, [data, mode, selectedRegistry]);

  // Set default registry when switching to SDKs
  useEffect(() => {
    if (mode === 'sdks' && availableRegistries.length > 0 && !availableRegistries.includes(selectedRegistry)) {
      setSelectedRegistry(availableRegistries[0]);
    }
  }, [mode, availableRegistries, selectedRegistry]);

  // Clear selected packages when switching mode or registry
  useEffect(() => {
    setSelectedPackages([]);
  }, [mode, selectedRegistry]);

  // Auto-select all packages if none selected
  useEffect(() => {
    if (selectedPackages.length === 0 && Object.keys(currentPackages).length > 0) {
      const packageKeys = Object.keys(currentPackages);
      setSelectedPackages(packageKeys);
    }
  }, [currentPackages, selectedPackages]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading release registry data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sentry Release Registry</h1>
        <p className="subtitle">Visualizing release history across Sentry SDKs and applications</p>
      </header>

      <div className="app-controls">
        <YearSelector
          years={data.years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      <div className="app-container">
        <aside className="sidebar">
          <PackageSelector
            mode={mode}
            onModeChange={setMode}
            selectedRegistry={selectedRegistry}
            onRegistryChange={setSelectedRegistry}
            selectedPackages={selectedPackages}
            onPackagesChange={setSelectedPackages}
            availableRegistries={availableRegistries}
            availablePackages={currentPackages}
          />
        </aside>

        <main className="main-content">
          <StatsOverview
            packages={currentPackages}
            selectedYear={selectedYear}
          />

          <Timeline
            packages={currentPackages}
            selectedPackages={selectedPackages}
            selectedYear={selectedYear}
          />

          <ActivityHeatmap
            packages={currentPackages}
            selectedYear={selectedYear}
          />

          <LatestVersions
            packages={currentPackages}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

