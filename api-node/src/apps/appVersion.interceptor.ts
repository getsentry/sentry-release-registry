import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { Response, Request } from 'express';

@Injectable()
export class AppVersionInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        const request = context.switchToHttp().getRequest<Request>();

        if (request.query.response === 'download') {
          response.status(302);
          response.header('Location', data.url);
          if (data.digest) {
            response.header('Digest', data.digest);
          }
          return '';
        }

        return data;
      }),
    );
  }
}
