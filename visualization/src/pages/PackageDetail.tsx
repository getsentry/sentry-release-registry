import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RegistryData, PackageData } from '../types';
import { DetailStats } from '../components/DetailStats';
import { ReleaseVelocityChart } from '../components/ReleaseVelocityChart';
import { VersionTypeDistribution } from '../components/VersionTypeDistribution';
import { ReleasesTable } from '../components/ReleasesTable';
import { Timeline } from '../components/Timeline';
import { ActivityHeatmap } from '../components/ActivityHeatmap';

interface PackageDetailProps {
  data: RegistryData;
}

export const PackageDetail: React.FC<PackageDetailProps> = ({ data }) => {
  const { mode, registry, packageName } = useParams<{
    mode: string;
    registry: string;
    packageName: string;
  }>();
  const navigate = useNavigate();

  // Decode package name (it may contain slashes like @sentry/react)
  const decodedPackageName = packageName ? decodeURIComponent(packageName) : '';

  // Find the package data
  const packageData: PackageData | undefined = React.useMemo(() => {
    if (!mode || !decodedPackageName) return undefined;

    if (mode === 'apps') {
      return data.apps[decodedPackageName];
    } else if (mode === 'sdks' && registry) {
      const registryPackages = data.packages[registry];
      return registryPackages ? registryPackages[decodedPackageName] : undefined;
    }

    return undefined;
  }, [data, mode, registry, decodedPackageName]);

  if (!packageData) {
    return (
      <div className="package-detail">
        <div className="detail-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
        <div className="error">Package not found</div>
      </div>
    );
  }

  // Create a packages object with single package for Timeline and ActivityHeatmap
  const packagesForCharts = {
    [decodedPackageName]: packageData,
  };

  return (
    <div className="package-detail">
      <div className="detail-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Dashboard
        </button>
        <div className="breadcrumb">
          <span>Home</span>
          <span className="separator">/</span>
          <span>{mode === 'apps' ? 'Apps' : 'SDKs'}</span>
          {mode === 'sdks' && registry && (
            <>
              <span className="separator">/</span>
              <span>{registry}</span>
            </>
          )}
          <span className="separator">/</span>
          <span className="current">{packageData.name}</span>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-title">
          <h1>{packageData.name}</h1>
          <p className="package-canonical">{packageData.canonical}</p>
          {packageData.latestVersion && (
            <div className="latest-version-info">
              <span className="version-badge large">{packageData.latestVersion.version}</span>
              {packageData.latestVersion.created_at && (
                <span className="release-date">
                  Released: {new Date(packageData.latestVersion.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        <DetailStats packageData={packageData} />

        <div className="charts-row">
          <div className="chart-half">
            <ReleaseVelocityChart packageData={packageData} />
          </div>
          <div className="chart-half">
            <VersionTypeDistribution packageData={packageData} />
          </div>
        </div>

        <Timeline
          packages={packagesForCharts}
          selectedPackages={[decodedPackageName]}
          selectedYear={null}
        />

        <ActivityHeatmap
          packages={packagesForCharts}
          selectedYear={null}
        />

        <ReleasesTable packageData={packageData} />
      </div>
    </div>
  );
};

