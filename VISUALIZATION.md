# Sentry Release Registry Visualization

## Overview

A comprehensive interactive dashboard for visualizing release history across all Sentry SDKs and applications. The dashboard provides insights into release patterns, frequencies, and version information across the entire Sentry ecosystem.

## What Was Built

### Architecture

- **Frontend**: React + TypeScript with Vite
- **Charts**: Recharts library for interactive visualizations
- **Data Processing**: Node.js script that aggregates JSON files at build time
- **Output**: Static HTML/CSS/JS that can be deployed anywhere

### Key Features

1. **Year Selector** (Top-level filter)
   - Filter all visualizations by specific year (2018-2025)
   - "All Time" option to view complete history

2. **Mode Switcher** (Apps vs SDKs)
   - Apps: Sentry-CLI, Relay, Craft, Symbolicator, Wizard
   - SDKs: All SDK packages across 13 registries

3. **Registry Selector** (for SDKs)
   - npm, pypi, maven, cocoapods, cargo, gem, composer, etc.
   - Total of 13 different package registries

4. **Package Selection**
   - Multi-select checkboxes for comparing packages
   - "Select All" / "Deselect All" functionality
   - Auto-selects first 5 packages by default

5. **Visualizations**

   **a) Statistics Overview**
   - Total packages in current view
   - Total releases (filtered by year)
   - Average releases per package

   **b) Release Timeline**
   - Line chart showing release frequency over time
   - Monthly aggregation
   - Multi-package comparison
   - Interactive tooltips

   **c) Activity Heatmap**
   - GitHub-style calendar heatmap
   - Daily release activity
   - Color intensity shows release count
   - Hover tooltips with exact dates and counts

   **d) Latest Versions Dashboard**
   - Grid of cards showing current versions
   - Links to repositories, documentation, and packages
   - Release dates
   - Canonical package identifiers

## Data Sources

The visualization processes JSON files from:

### Apps (5 total)
- `apps/sentry-cli/` (~100 versions)
- `apps/relay/` (~50 versions)
- `apps/craft/` (~45 versions)
- `apps/symbolicator/` (~25 versions)
- `apps/sentry-wizard/` (~59 versions)

### Packages (54 total across 13 registries)
- **npm**: 32 packages (@sentry/react, @sentry/node, etc.)
- **pypi**: 1 package (sentry-sdk)
- **maven**: 1 package (io.sentry)
- **cocoapods**: 1 package (sentry-cocoa)
- **cargo**: 2 packages (sentry, sentry-actix)
- **gem**: 8 packages (sentry-ruby, sentry-rails, etc.)
- **composer**: 1 package (sentry/sentry)
- **nuget**: Multiple .NET packages
- **pub**: Dart/Flutter packages
- **upm**: Unity packages
- **github**: getsentry releases
- **hex**: Elixir packages
- **psgallery**: PowerShell modules

### Historical Coverage
- **Years**: 2018-2025 (8 years of data)
- **Total versions**: Thousands across all packages

## Usage

### Development

```bash
cd visualization
npm install
npm run dev
```

Open http://localhost:5173 to view the dashboard.

### Production Build

```bash
cd visualization
npm run build
```

Output will be in `visualization/dist/` directory.

### Preview Production Build

```bash
cd visualization
npm run preview
```

## Deployment Options

The built static site can be deployed to:

1. **GitHub Pages**
   - Push `dist/` folder to `gh-pages` branch
   - Enable GitHub Pages in repository settings

2. **Netlify**
   - Connect repository
   - Build command: `cd visualization && npm run build`
   - Publish directory: `visualization/dist`

3. **Vercel**
   - Import repository
   - Root directory: `visualization`
   - Build command: `npm run build`
   - Output directory: `dist`

4. **AWS S3 + CloudFront**
   - Upload contents of `dist/` to S3 bucket
   - Configure bucket for static website hosting
   - Optional: Add CloudFront distribution

5. **Any Static Web Server**
   - Simply serve the contents of `dist/` directory
   - No server-side processing required

## Project Structure

```
visualization/
├── src/
│   ├── App.tsx                    # Main application
│   ├── main.tsx                   # React entry point
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.css                    # Styling
│   ├── components/
│   │   ├── YearSelector.tsx       # Top-level year filter
│   │   ├── PackageSelector.tsx    # App/SDK/Registry selection
│   │   ├── Timeline.tsx           # Monthly release line chart
│   │   ├── ActivityHeatmap.tsx    # Calendar heatmap
│   │   ├── LatestVersions.tsx     # Version cards grid
│   │   └── StatsOverview.tsx      # High-level metrics
│   └── utils/
│       └── dataLoader.ts          # Fetch registry data
├── public/
│   └── registry-data.json         # Generated aggregate data (6.7 MB)
├── dist/                          # Build output (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md

scripts/
└── generate-data.js               # Aggregates all JSON files
```

## Data Processing

The `scripts/generate-data.js` script:
1. Scans `apps/` and `packages/` directories recursively
2. Parses all JSON files (except `latest.json`)
3. Extracts version, release date, and metadata
4. Groups by package and registry
5. Sorts versions by date (newest first)
6. Identifies latest version for each package
7. Extracts all unique years
8. Outputs consolidated `registry-data.json` (6.7 MB)

This script runs automatically before every build and dev server start.

## Color Scheme

- **Primary**: Purple gradient (#667eea to #764ba2)
- **Success**: Green shades
- **Charts**: 10-color palette for multi-line charts
- **Heatmap**: GitHub-style green intensity scale
- **Background**: Light gray (#f5f7fa)
- **Cards**: White with subtle shadows

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design for mobile/tablet/desktop

## Performance

- **Initial Load**: ~550 KB JS + 6.7 MB data
- **Rendering**: Client-side, all data loaded upfront
- **Optimization**: Consider code-splitting if needed
- **Caching**: Static assets can be aggressively cached

## Future Enhancements

Potential improvements:
- Add version comparison tool
- Filter by date range (not just year)
- Export charts as images
- Add release notes/changelog integration
- Search functionality across all packages
- Download data as CSV/JSON
- Add more statistical analysis (trends, patterns)
- Show dependency relationships between packages

## Built With

- React 18
- TypeScript 5
- Vite 5
- Recharts 2
- date-fns 3

## Files Created

- `/visualization/` - Complete React application
- `/scripts/generate-data.js` - Data aggregation script
- `/VISUALIZATION.md` - This documentation

All source code follows TypeScript best practices with strict mode enabled.

