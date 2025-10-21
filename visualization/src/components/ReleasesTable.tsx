import React from 'react';
import { PackageData } from '../types';
import { identifyBreakingChanges } from '../utils/versionAnalysis';
import { format } from 'date-fns';

interface ReleasesTableProps {
  packageData: PackageData;
}

export const ReleasesTable: React.FC<ReleasesTableProps> = ({ packageData }) => {
  const breakingChanges = identifyBreakingChanges(packageData.versions);

  // Sort versions by date (newest first)
  const sortedVersions = [...packageData.versions].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="releases-table-container">
      <h2>All Releases</h2>
      <div className="table-wrapper">
        <table className="releases-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Release Date</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {sortedVersions.map((version, index) => {
              const isBreaking = breakingChanges.has(version.version);
              return (
                <tr key={`${version.version}-${index}`} className={isBreaking ? 'version-major' : ''}>
                  <td>
                    <div className="version-cell">
                      <span className="version-number">{version.version}</span>
                      {isBreaking && (
                        <span className="breaking-badge" title="Breaking change">
                          MAJOR
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {version.created_at
                      ? format(new Date(version.created_at), 'MMM dd, yyyy')
                      : 'N/A'}
                  </td>
                  <td>
                    <div className="release-links">
                      {version.repo_url && (
                        <a
                          href={version.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="release-link"
                        >
                          Repository
                        </a>
                      )}
                      {version.main_docs_url && (
                        <a
                          href={version.main_docs_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="release-link"
                        >
                          Docs
                        </a>
                      )}
                      {version.package_url && (
                        <a
                          href={version.package_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="release-link"
                        >
                          Package
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

