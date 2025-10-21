import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { RegistryData, PackageData } from './types';
import { loadRegistryData } from './utils/dataLoader';
import { YearSelector } from './components/YearSelector';
import { PackageSelector } from './components/PackageSelector';
import { StatsOverview } from './components/StatsOverview';
import { LatestVersions } from './components/LatestVersions';
import { Timeline } from './components/Timeline';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { PackageDetail } from './pages/PackageDetail';
import './App.css';

function App() {
  const [data, setData] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize mode from query param, default to 'sdks'
  const [mode, setMode] = useState<'apps' | 'sdks'>(() => {
    const modeParam = searchParams.get('mode');
    return (modeParam === 'apps' || modeParam === 'sdks') ? modeParam : 'sdks';
  });
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

  // Sync mode with query parameter
  useEffect(() => {
    setSearchParams({ mode }, { replace: true });
  }, [mode, setSearchParams]);

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

  // Auto-select all packages when switching mode or registry
  useEffect(() => {
    if (Object.keys(currentPackages).length > 0) {
      const packageKeys = Object.keys(currentPackages);
      setSelectedPackages(packageKeys);
    }
  }, [currentPackages]);

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

  const Dashboard = () => (
    <>
      <header className="app-header">
        <div className="header-content">
          <svg className="sentry-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 66">
            <path d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z" transform="translate(11, 11)" fill="#ffffff"></path>
          </svg>
          <div className="header-text">
            <h1>Sentry Release Registry</h1>
            <p className="subtitle">Visualizing release history across Sentry SDKs and applications</p>
          </div>
        </div>
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
    </>
  );

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/package/:mode/:registry/:packageName" element={<PackageDetail data={data} />} />
        <Route path="/package/:mode/:packageName" element={<PackageDetail data={data} />} />
      </Routes>
    </div>
  );
}

export default App;

