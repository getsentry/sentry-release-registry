import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
/**
 * Aligns the response headers sent from this API with the headers from the old Flask API.
 * For now, we'll do this to ensure full backwards compatibility. We can tentatively remove
 * or change headers in the future if necessary.
 */
@Injectable()
export class AlignHeadersInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        response.removeHeader('Connection');
        response.removeHeader('x-powered-by');
        response.removeHeader('date');
        response.removeHeader('etag');
      }),
    );
  }
}
