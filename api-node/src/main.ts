import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AlignHeadersInterceptor } from './common/alignHeaders.interceptor';
import { getPort } from './common/port';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'fatal', 'verbose', 'log', 'warn'],
    forceCloseConnections: true,
    cors: { origin: '*', allowedHeaders: ['*'] },
  });

  app.useGlobalInterceptors(new AlignHeadersInterceptor());

  // disable setting the etag header
  app.getHttpAdapter().getInstance().set('etag', false);

  // Add signal handlers
  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Graceful shutdown...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    await app.close();
    process.exit(0);
  });

  await app.listen(getPort());
}

if (process.argv.includes('--smoke')) {
  console.log('Smoke test successful!');
} else {
  bootstrap();
}
