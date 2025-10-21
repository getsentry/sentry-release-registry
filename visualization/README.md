# Sentry Release Registry Visualization

An interactive dashboard for visualizing release history across all Sentry SDKs and applications.

## Features

- **Release Timeline**: Track release frequency over time with interactive line charts
- **Activity Heatmap**: GitHub-style calendar heatmap showing release activity patterns
- **Latest Versions Dashboard**: Quick reference for current versions across all packages
- **Statistics Overview**: High-level metrics including total packages, releases, and averages
- **Year Filtering**: Filter all visualizations by specific year or view all-time data
- **Package Selection**: Switch between Apps and SDKs, select specific packages to compare

## Setup

### Prerequisites

- Node.js 18+ or compatible runtime

### Installation

```bash
cd visualization
npm install
```

## Usage

### Development

Run the development server:

```bash
npm run dev
```

This will:
1. Generate the registry data from JSON files
2. Start the Vite development server
3. Open the application at http://localhost:5173

### Production Build

Build the static site:

```bash
npm run build
```

The static files will be generated in the `dist/` directory and can be served by any static hosting service.

### Preview Production Build

```bash
npm run preview
```

## Data Source

The visualization reads release data from JSON files in:
- `apps/` - Sentry applications (CLI, Relay, Craft, etc.)
- `packages/` - SDK packages across various registries (npm, pypi, maven, etc.)

The data aggregation script (`scripts/generate-data.js`) processes all JSON files and generates a consolidated `registry-data.json` file in the `public/` directory.

## Project Structure

```
visualization/
├── src/
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Entry point
│   ├── types.ts             # TypeScript interfaces
│   ├── App.css              # Styling
│   ├── components/
│   │   ├── YearSelector.tsx       # Year filter control
│   │   ├── PackageSelector.tsx    # Package/registry selection
│   │   ├── Timeline.tsx           # Release timeline chart
│   │   ├── ActivityHeatmap.tsx    # Calendar heatmap
│   │   ├── LatestVersions.tsx     # Version cards grid
│   │   └── StatsOverview.tsx      # Statistics dashboard
│   └── utils/
│       └── dataLoader.ts          # Data fetching utility
├── public/
│   └── registry-data.json         # Generated data (created by build script)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Technologies

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Recharts** - Charting library
- **date-fns** - Date manipulation utilities

## Deployment

The built static site can be deployed to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

Simply serve the contents of the `dist/` directory after running `npm run build`.

