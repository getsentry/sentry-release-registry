import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '../..');
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');
const outputFile = path.join(__dirname, '../public', 'registry-data.json');

function getAllJsonFiles(dir, baseDir = dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...getAllJsonFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'latest.json') {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}:`, err.message);
  }
  
  return files;
}

function parseVersion(data, filePath) {
  try {
    return {
      version: data.version,
      created_at: data.created_at || null,
      name: data.name,
      canonical: data.canonical,
      repo_url: data.repo_url,
      main_docs_url: data.main_docs_url,
      package_url: data.package_url,
    };
  } catch (err) {
    console.warn(`Warning: Could not parse ${filePath}:`, err.message);
    return null;
  }
}

function processDirectory(dir, isApp = false) {
  const result = {};
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const packageName = entry.name;
      const packageDir = path.join(dir, packageName);
      
      // Check if this is a namespace directory (e.g., @sentry)
      const namespaceMarker = path.join(packageDir, '__NAMESPACE__');
      if (fs.existsSync(namespaceMarker)) {
        // Process scoped packages within the namespace
        const scopedEntries = fs.readdirSync(packageDir, { withFileTypes: true });
        
        for (const scopedEntry of scopedEntries) {
          if (!scopedEntry.isDirectory()) continue;
          
          const scopedPackageName = `${packageName}/${scopedEntry.name}`;
          const scopedPackageDir = path.join(packageDir, scopedEntry.name);
          const versions = [];
          
          // Get all JSON files in this scoped package directory
          const jsonFiles = getAllJsonFiles(scopedPackageDir);
          
          for (const jsonFile of jsonFiles) {
            try {
              const content = fs.readFileSync(jsonFile, 'utf-8');
              const data = JSON.parse(content);
              const version = parseVersion(data, jsonFile);
              
              if (version && version.version) {
                versions.push(version);
              }
            } catch (err) {
              console.warn(`Warning: Could not read ${jsonFile}:`, err.message);
            }
          }
          
          if (versions.length > 0) {
            // Sort versions by date
            versions.sort((a, b) => {
              if (!a.created_at) return 1;
              if (!b.created_at) return -1;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            
            result[scopedPackageName] = {
              name: versions[0].name,
              canonical: versions[0].canonical,
              versions: versions,
              latestVersion: versions[0],
            };
          }
        }
        continue; // Skip processing the namespace directory itself
      }
      
      // Regular package (not a namespace)
      const versions = [];
      
      // Get all JSON files in this package directory
      const jsonFiles = getAllJsonFiles(packageDir);
      
      for (const jsonFile of jsonFiles) {
        try {
          const content = fs.readFileSync(jsonFile, 'utf-8');
          const data = JSON.parse(content);
          const version = parseVersion(data, jsonFile);
          
          if (version && version.version) {
            versions.push(version);
          }
        } catch (err) {
          console.warn(`Warning: Could not read ${jsonFile}:`, err.message);
        }
      }
      
      if (versions.length > 0) {
        // Sort versions by date
        versions.sort((a, b) => {
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        result[packageName] = {
          name: versions[0].name,
          canonical: versions[0].canonical,
          versions: versions,
          latestVersion: versions[0],
        };
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not process directory ${dir}:`, err.message);
  }
  
  return result;
}

function processPackagesDirectory(packagesDir) {
  const result = {};
  
  try {
    const registries = fs.readdirSync(packagesDir, { withFileTypes: true });
    
    for (const registry of registries) {
      if (!registry.isDirectory()) continue;
      
      const registryName = registry.name;
      const registryDir = path.join(packagesDir, registryName);
      
      console.log(`Processing registry: ${registryName}`);
      result[registryName] = processDirectory(registryDir, false);
    }
  } catch (err) {
    console.warn(`Warning: Could not process packages directory:`, err.message);
  }
  
  return result;
}

function extractYears(apps, packages) {
  const years = new Set();
  
  // Extract years from apps
  for (const app of Object.values(apps)) {
    for (const version of app.versions) {
      if (version.created_at) {
        const year = new Date(version.created_at).getFullYear();
        years.add(year);
      }
    }
  }
  
  // Extract years from packages
  for (const registry of Object.values(packages)) {
    for (const pkg of Object.values(registry)) {
      for (const version of pkg.versions) {
        if (version.created_at) {
          const year = new Date(version.created_at).getFullYear();
          years.add(year);
        }
      }
    }
  }
  
  return Array.from(years).sort((a, b) => b - a);
}

console.log('Generating release registry data...');
console.log('Processing apps...');
const apps = processDirectory(appsDir, true);
console.log(`Found ${Object.keys(apps).length} apps`);

console.log('Processing packages...');
const packages = processPackagesDirectory(packagesDir);
const totalPackages = Object.values(packages).reduce((sum, registry) => sum + Object.keys(registry).length, 0);
console.log(`Found ${totalPackages} packages across ${Object.keys(packages).length} registries`);

const years = extractYears(apps, packages);
console.log(`Found releases from years: ${years.join(', ')}`);

const data = {
  apps,
  packages,
  years,
};

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log(`Data written to ${outputFile}`);
console.log('Done!');

