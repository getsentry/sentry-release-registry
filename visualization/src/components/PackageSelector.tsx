import React from 'react';
import { PackageData } from '../types';
import { getDisplayName } from '../utils/packageUtils';

interface PackageSelectorProps {
  mode: 'apps' | 'sdks';
  onModeChange: (mode: 'apps' | 'sdks') => void;
  selectedRegistry: string;
  onRegistryChange: (registry: string) => void;
  selectedPackages: string[];
  onPackagesChange: (packages: string[]) => void;
  availableRegistries: string[];
  availablePackages: { [key: string]: PackageData };
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  mode,
  onModeChange,
  selectedRegistry,
  onRegistryChange,
  selectedPackages,
  onPackagesChange,
  availableRegistries,
  availablePackages,
}) => {
  const packageNames = Object.keys(availablePackages);

  const handlePackageToggle = (packageName: string) => {
    if (selectedPackages.includes(packageName)) {
      onPackagesChange(selectedPackages.filter((p) => p !== packageName));
    } else {
      onPackagesChange([...selectedPackages, packageName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPackages.length === packageNames.length) {
      onPackagesChange([]);
    } else {
      onPackagesChange(packageNames);
    }
  };

  return (
    <div className="package-selector">
      <div className="mode-tabs">
        <button
          className={mode === 'apps' ? 'active' : ''}
          onClick={() => onModeChange('apps')}
        >
          Apps
        </button>
        <button
          className={mode === 'sdks' ? 'active' : ''}
          onClick={() => onModeChange('sdks')}
        >
          SDKs
        </button>
      </div>

      {mode === 'sdks' && (
        <div className="registry-selector">
          <label htmlFor="registry-select">Registry:</label>
          <select
            id="registry-select"
            value={selectedRegistry}
            onChange={(e) => onRegistryChange(e.target.value)}
          >
            {availableRegistries.map((registry) => (
              <option key={registry} value={registry}>
                {registry}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="package-list">
        <div className="package-list-header">
          <h3>Select Packages</h3>
          <button onClick={handleSelectAll} className="select-all-btn">
            {selectedPackages.length === packageNames.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="package-checkboxes">
          {packageNames.map((packageName) => (
            <label key={packageName} className="package-checkbox">
              <input
                type="checkbox"
                checked={selectedPackages.includes(packageName)}
                onChange={() => handlePackageToggle(packageName)}
              />
              <span>{getDisplayName(availablePackages[packageName].canonical)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

