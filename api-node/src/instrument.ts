import * as Sentry from '@sentry/nestjs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require('../package.json');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: packageJson.version,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});
