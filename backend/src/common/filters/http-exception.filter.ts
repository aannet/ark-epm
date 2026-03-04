import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseBody =
      typeof exceptionResponse === 'object' ? exceptionResponse : {};
    const code = this.extractCode(
      responseBody as Record<string, unknown>,
      status,
    );

    const errorResponse = {
      statusCode: status,
      code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.warn({
      method: request.method,
      url: request.url,
      statusCode: status,
      code,
      requestId: request.headers['x-request-id'],
    });

    response.status(status).json(errorResponse);
  }

  private extractCode(
    responseBody: Record<string, unknown>,
    status: number,
  ): string {
    if (responseBody.code && typeof responseBody.code === 'string') {
      return responseBody.code;
    }

    const defaultCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
    };

    return defaultCodes[status] || 'INTERNAL_ERROR';
  }
}
