import React from 'react';
import { PackageData } from '../types';

interface LatestVersionsProps {
  packages: { [key: string]: PackageData };
}

export const LatestVersions: React.FC<LatestVersionsProps> = ({ packages }) => {
  const packageList = Object.entries(packages).map(([key, pkg]) => ({
    key,
    ...pkg,
  }));

  return (
    <div className="latest-versions">
      <h2>Latest Versions</h2>
      <div className="versions-grid">
        {packageList.map((pkg) => (
          <div key={pkg.key} className="version-card">
            <div className="version-card-header">
              <h3>{pkg.name}</h3>
              <span className="version-badge">{pkg.latestVersion?.version}</span>
            </div>
            <div className="version-card-body">
              <p className="canonical">{pkg.canonical}</p>
              {pkg.latestVersion?.created_at && (
                <p className="release-date">
                  Released: {new Date(pkg.latestVersion.created_at).toLocaleDateString()}
                </p>
              )}
              <div className="version-links">
                {pkg.latestVersion?.repo_url && (
                  <a href={pkg.latestVersion.repo_url} target="_blank" rel="noopener noreferrer">
                    Repository
                  </a>
                )}
                {pkg.latestVersion?.main_docs_url && (
                  <a href={pkg.latestVersion.main_docs_url} target="_blank" rel="noopener noreferrer">
                    Documentation
                  </a>
                )}
                {pkg.latestVersion?.package_url && (
                  <a href={pkg.latestVersion.package_url} target="_blank" rel="noopener noreferrer">
                    Package
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

