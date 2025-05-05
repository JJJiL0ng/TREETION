import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import storageConfig from './config/storage.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AudioModule } from './audio/audio.module';
import { AiModule } from './ai/ai.module';
import { TreeModule } from './tree/tree.module';
import { SvgModule } from './svg/svg.module';

// 공통 필터 및 인터셉터
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SttClovaModule } from './stt-clova/stt-clova.module';
import { SttWhisperModule } from './stt-whisper/stt-whisper.module';
import { SttUpgradeModule } from './stt-upgrade/stt-upgrade.module';
import { ChatGptModule } from './chat-gpt/chat-gpt.module';
import { ClassModule } from './class/class.module';
// 환경 설정 관련
import appConfig from './config/app.config';
import dbConfig from './config/db.config';
import apiConfig from './config/api.config';

@Module({
  imports: [
    // 환경 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [appConfig, dbConfig, apiConfig, storageConfig], // 설정 파일 로드
    }),

    // 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbOptions = configService.get('database');
        
        // 설정 로깅
        console.log('Database connection config:', {
          type: dbOptions.type,
          host: dbOptions.host,
          port: dbOptions.port,
          username: dbOptions.username,
          database: dbOptions.database,
          ssl: dbOptions.ssl || false,
        });
        
        // 자체 서명된 인증서를 허용하는 SSL 설정
        return {
          ...dbOptions,
          ssl: {
            rejectUnauthorized: false, // 자체 서명된 인증서 허용
          },
        };
      },
    }),

    // 정적 파일 제공 (업로드된 오디오 파일 등)
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(process.cwd(), configService.get('app.upload.dir') || 'uploads'),
          serveRoot: '/uploads',
          serveStaticOptions: {
            index: false,
            maxAge: 86400000, // 1일
          },
        },
      ],
    }),

    // 기능 모듈들
    AuthModule,
    UsersModule,
    AudioModule,
    AiModule,
    TreeModule,
    SvgModule,
    SttClovaModule,
    SttWhisperModule,
    SttUpgradeModule,
    ChatGptModule,
    ClassModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 전역 예외 필터
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 전역 로깅 인터셉터
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 응답 변환 인터셉터
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule { }