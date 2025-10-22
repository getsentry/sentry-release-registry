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

### URL Query Parameters

The dashboard supports URL query parameters for deep linking and sharing specific views:

**Mode Parameter**
- `?mode=sdks` - Shows SDK packages (default)
- `?mode=apps` - Shows Sentry applications

Examples:
- `https://example.com/` - Loads with SDKs (default)
- `https://example.com/?mode=apps` - Loads with Apps mode
- `https://example.com/?mode=sdks` - Loads with SDKs mode

The URL automatically updates when you switch between Apps and SDKs using the mode toggle, making it easy to share specific views with your team.

5. **Dashboard Visualizations**

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
   - Package names extracted from canonical identifiers (e.g., "@sentry/react", "sentry-sdk")
   - Links to repositories, documentation, and packages
   - Release dates
   - Canonical package identifiers
   - Clickable cards to view package details

6. **Package Detail Pages** (NEW)
   
   Click any package card to view comprehensive release information:
   
   **a) Package Header**
   - Package name extracted from canonical identifier (e.g., "@sentry/react")
   - Full canonical identifier (e.g., "npm:@sentry/react")
   - Latest version badge with release date
   - Breadcrumb navigation
   - Back to dashboard button
   
   **b) Release Statistics**
   - Total number of releases
   - Average time between releases (in days)
   - Time since last release (human-readable)
   - Breaking changes count
   - Release cadence breakdown (major/minor/patch)
   
   **c) Release Velocity Chart**
   - Line chart showing days between consecutive releases
   - Identifies trends in release frequency
   - Interactive tooltips with version details
   
   **d) Version Type Distribution**
   - Pie chart showing major/minor/patch breakdown
   - Color-coded by version type
   - Highlights breaking changes count
   
   **e) Release Timeline & Activity**
   - Same timeline and heatmap visualizations
   - Shows all years (ignores year filter)
   - Focused on single package
   
   **f) Complete Releases Table**
   - All releases with version, date, and links
   - Highlights major versions with visual badge
   - Repository, documentation, and package links
   - Sortable and scrollable

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
- **maven**: 1 package (io.sentry:sentry)
- **cocoapods**: 1 package (Sentry)
- **cargo**: 2 packages (sentry, sentry-actix)
- **gem**: 8 packages (sentry-ruby, sentry-rails, etc.)
- **composer**: 1 package (sentry/sentry)
- **nuget**: Multiple .NET packages
- **pub**: Dart/Flutter packages
- **upm**: Unity packages
- **github**: getsentry releases
- **hex**: Elixir packages
- **psgallery**: PowerShell modules

**Note:** Package names displayed throughout the visualization are extracted from the canonical identifiers by removing the registry prefix. For example, `npm:@sentry/react` is displayed as `@sentry/react`.

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

## Live Deployment

The visualization is automatically deployed to GitHub Pages:

🔗 **Live Site**: `https://<username>.github.io/sentry-release-registry/`

### Automatic Deployment

Every push to the `main` branch that modifies:
- `visualization/` directory
- `apps/` or `packages/` directories (data sources)
- The deployment workflow itself

Will trigger an automatic build and deployment to GitHub Pages.

**View Deployment Status**: Check the "Actions" tab in the repository to see the deployment progress and history.

### Manual Deployment

You can also trigger a deployment manually:
1. Go to the "Actions" tab in the repository
2. Select "Deploy Visualization to GitHub Pages"
3. Click "Run workflow"

## Alternative Deployment Options

The built static site can also be deployed to:

1. **Netlify**
   - Connect repository
   - Build command: `cd visualization && npm run build`
   - Publish directory: `visualization/dist`

2. **Vercel**
   - Import repository
   - Root directory: `visualization`
   - Build command: `npm run build`
   - Output directory: `dist`

3. **AWS S3 + CloudFront**
   - Upload contents of `dist/` to S3 bucket
   - Configure bucket for static website hosting
   - Optional: Add CloudFront distribution

4. **Any Static Web Server**
   - Simply serve the contents of `dist/` directory
   - No server-side processing required

## Project Structure

```
visualization/
├── src/
│   ├── App.tsx                    # Main application with routing
│   ├── main.tsx                   # React entry point
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.css                    # Styling
│   ├── components/
│   │   ├── YearSelector.tsx       # Top-level year filter
│   │   ├── PackageSelector.tsx    # App/SDK/Registry selection
│   │   ├── Timeline.tsx           # Monthly release line chart
│   │   ├── ActivityHeatmap.tsx    # Calendar heatmap
│   │   ├── LatestVersions.tsx     # Version cards grid (clickable)
│   │   ├── StatsOverview.tsx      # High-level metrics
│   │   ├── DetailStats.tsx        # Package statistics (detail page)
│   │   ├── ReleaseVelocityChart.tsx  # Release frequency chart
│   │   ├── VersionTypeDistribution.tsx  # Version type pie chart
│   │   └── ReleasesTable.tsx      # Complete releases table
│   ├── pages/
│   │   └── PackageDetail.tsx      # Package detail page
│   └── utils/
│       ├── dataLoader.ts          # Fetch registry data
│       ├── versionAnalysis.ts     # Version parsing & statistics
│       └── packageUtils.ts        # Package name display utilities
├── scripts/
│   └── generate-data.js           # Aggregates all JSON files
├── public/
│   └── registry-data.json         # Generated aggregate data (6.7 MB)
├── dist/                          # Build output (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

## Data Processing

The `visualization/scripts/generate-data.js` script:
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
- React Router 6
- Recharts 2
- date-fns 3

## Files Created

- `/visualization/` - Complete React application
- `/visualization/scripts/generate-data.js` - Data aggregation script
- `/VISUALIZATION.md` - This documentation

All source code follows TypeScript best practices with strict mode enabled.

