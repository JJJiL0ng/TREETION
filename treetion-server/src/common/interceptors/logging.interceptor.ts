// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, body, params, query, ip } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const userId = request['user']?.userId || 'anonymous';
    
    const now = Date.now();
    const requestId = `${userId}-${now}-${Math.random().toString(36).substring(2, 15)}`;
    
    // 요청 로깅
    this.logger.log(
      `[REQ] ${method} ${url} - RequestId: ${requestId}`,
      {
        timestamp: new Date().toISOString(),
        method,
        url,
        params,
        query,
        ip,
        userAgent,
        userId,
        // body에 민감한 정보가 있을 수 있으므로 로깅 시 주의
        body: this.sanitizeBody(body),
        requestId,
      }
    );

    // 응답 로깅을 위해 응답 스트림에 훅 추가
    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now;
          
          this.logger.log(
            `[RES] ${method} ${url} - ${response.statusCode} - ${duration}ms - RequestId: ${requestId}`,
            {
              timestamp: new Date().toISOString(),
              duration,
              statusCode: response.statusCode,
              // 민감한 응답 데이터가 있을 수 있으므로 로깅 시 주의
              // responseSize: JSON.stringify(data).length,
              requestId,
            }
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          
          this.logger.error(
            `[RES:ERROR] ${method} ${url} - ${error.status || 500} - ${duration}ms - RequestId: ${requestId}`,
            {
              timestamp: new Date().toISOString(),
              duration,
              error: {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
              },
              requestId,
            }
          );
        },
      }),
    );
  }

  // 민감한 데이터 필터링
  private sanitizeBody(body: any): any {
    if (!body) {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'key', 'Authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '********';
      }
    }

    return sanitized;
  }
}