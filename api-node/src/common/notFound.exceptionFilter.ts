import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';

import type { Response } from 'express';

import { NOT_FOUND_HTML } from './htmlTemplates';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(_exception: NotFoundException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(404);
    response.send(NOT_FOUND_HTML);
  }
}
