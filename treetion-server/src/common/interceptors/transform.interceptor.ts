// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: boolean;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // HTTP 컨텍스트만 처리
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    
    // 성공 응답일 경우에만 변환
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return next.handle().pipe(
        map(data => {
          // 이미 응답 형식에 맞게 변환된 경우 그대로 반환
          if (data && typeof data === 'object' && 'status' in data) {
            return data;
          }
          
          // null 또는 undefined인 경우 빈 객체로 처리
          if (data === null || data === undefined) {
            return {
              status: true,
              data: {}
            };
          }
          
          // 표준 형식으로 변환
          return {
            status: true,
            data
          };
        }),
      );
    }
    
    // 그 외의 경우(에러 등) 그대로 반환
    return next.handle();
  }
}