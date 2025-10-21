import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageData } from '../types';

interface LatestVersionsProps {
  packages: { [key: string]: PackageData };
}

export const LatestVersions: React.FC<LatestVersionsProps> = ({ packages }) => {
  const navigate = useNavigate();
  
  // Determine mode and registry from the current context
  // This is a simple approach - in a real app, you might pass these as props
  const determineContext = () => {
    // Check if we're on the apps or sdks view by examining the packages
    const firstPackage = Object.values(packages)[0];
    if (!firstPackage) return { mode: 'apps', registry: null };
    
    // Apps have canonical starting with "app:"
    if (firstPackage.canonical.startsWith('app:')) {
      return { mode: 'apps', registry: null };
    }
    
    // For SDKs, try to determine registry from canonical
    // Format is typically "registry:package" like "npm:@sentry/react"
    const colonIndex = firstPackage.canonical.indexOf(':');
    if (colonIndex > 0) {
      const registry = firstPackage.canonical.substring(0, colonIndex);
      return { mode: 'sdks', registry };
    }
    
    return { mode: 'sdks', registry: 'npm' };
  };

  const packageList = Object.entries(packages).map(([key, pkg]) => ({
    key,
    ...pkg,
  }));

  const handleCardClick = (pkg: typeof packageList[0]) => {
    const { mode, registry } = determineContext();
    const encodedPackageName = encodeURIComponent(pkg.key);
    
    if (mode === 'apps') {
      navigate(`/package/${mode}/${encodedPackageName}`);
    } else {
      navigate(`/package/${mode}/${registry}/${encodedPackageName}`);
    }
  };

  return (
    <div className="latest-versions">
      <h2>Latest Versions</h2>
      <div className="versions-grid">
        {packageList.map((pkg) => (
          <div 
            key={pkg.key} 
            className="version-card clickable"
            onClick={() => handleCardClick(pkg)}
          >
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
                  <a 
                    href={pkg.latestVersion.repo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Repository
                  </a>
                )}
                {pkg.latestVersion?.main_docs_url && (
                  <a 
                    href={pkg.latestVersion.main_docs_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Documentation
                  </a>
                )}
                {pkg.latestVersion?.package_url && (
                  <a 
                    href={pkg.latestVersion.package_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
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

