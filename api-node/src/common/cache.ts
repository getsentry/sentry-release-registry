import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

// values taken from apiserver.py cache config
export const CACHE_DEFAULT_SETTINGS = {
  max: 200,
  // ttl of cache-manager@5 is in milliseconds
  ttl: 3600 * 1000,
};

/**
 * Custom interceptor to
 * - disable caching if the REGISTRY_ENABLE_CACHE environment variable is not set to '1' or FLASK_ENV is not 'production'.
 * - set the X-From-Cache header to 1 if the response is served from cache (hit).
 */
export class ReleaseRegistryCacheInterceptor extends CacheInterceptor {
  public async intercept(
    context: ExecutionContext,
    next: CallHandler,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Observable<any>> {
    if (!isCachingEnabled()) {
      return next.handle();
    }

    const isCacheHit = !!(await this.cacheManager.get(this.trackBy(context)));

    const cachedResponse = await super.intercept(context, next);

    return cachedResponse.pipe(
      tap((response) => {
        if (response && isCacheHit) {
          const httpAdapter = this.httpAdapterHost.httpAdapter;
          httpAdapter.setHeader(
            context.switchToHttp().getResponse(),
            'X-From-Cache',
            '1',
          );
        }
      }),
    );
  }
}

function isCachingEnabled(): boolean {
  const enabledCacheEnvVar = process.env.REGISTRY_ENABLE_CACHE;
  if (enabledCacheEnvVar) {
    return enabledCacheEnvVar === '1';
  }
  return process.env.FLASK_ENV === 'production';
}
