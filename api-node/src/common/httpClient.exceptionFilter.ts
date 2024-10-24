import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';

import type { Response } from 'express';

import { BAD_REQUEST_HTML, NOT_FOUND_HTML } from './htmlTemplates';

/**
 * Throwing Http Client Error exceptions like NotFoundException and BadRequestException
 * makes NestJS respond with the respective status and a JSON body.
 *
 * In the Flask API, we returned a HTML template in such cases. Therefore, we need
 * to implement a custom exception filter to stick to the same behavior.
 */
@Catch(NotFoundException, BadRequestException)
export class HttpClientExceptionFilter implements ExceptionFilter {
  catch(
    exception: NotFoundException | BadRequestException,
    host: ArgumentsHost,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    response.status(status);
    if (status === 404) {
      response.send(NOT_FOUND_HTML);
    } else if (status === 400) {
      response.send(BAD_REQUEST_HTML);
    }
  }
}
