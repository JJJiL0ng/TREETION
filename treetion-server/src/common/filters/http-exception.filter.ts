// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = exception.getResponse ? exception.getResponse() : null;
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    let errorDetails = {};

    // 오류 코드 및 메시지 처리
    if (errorResponse && typeof errorResponse === 'object') {
      const errorObj = errorResponse as any;
      errorCode = errorObj.errorCode || errorObj.error || 'SERVER_ERROR';
      errorMessage = errorObj.message || exception.message || '오류가 발생했습니다.';
      errorDetails = errorObj.details || {};
    } else if (typeof errorResponse === 'string') {
      errorMessage = errorResponse;
    } else {
      errorMessage = exception.message;
    }

    // 로깅
    this.logger.error(
      `Error ${status} - ${errorCode}: ${errorMessage}`,
      {
        path: request.url,
        method: request.method,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        ip: request.ip,
        userId: request['user']?.userId,
      }
    );

    // 클라이언트가 알아야 할 정보만 포함한 응답
    const responseBody = {
      status: false,
      errorCode,
      message: errorMessage,
      details: Object.keys(errorDetails).length > 0 ? errorDetails : undefined,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(responseBody);
  }
}