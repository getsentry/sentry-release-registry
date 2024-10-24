import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AlignHeadersInterceptor } from './common/alignHeaders.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'fatal', 'verbose', 'log', 'warn'],
    forceCloseConnections: true,
    cors: { origin: '*', allowedHeaders: ['*'] },
  });

  app.useGlobalInterceptors(new AlignHeadersInterceptor());

  // disable setting the etag header
  app.getHttpAdapter().getInstance().set('etag', false);

  await app.listen(3000);
}

bootstrap();
