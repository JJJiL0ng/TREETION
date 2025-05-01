import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // 로그 레벨 줄이기
  });
  const configService = app.get(ConfigService);

  // CORS 설정
  const corsOrigins = configService.get<string>('CORS_ORIGIN')?.split(',') || 
                     ['https://www.treetion.com', 'http://localhost:3000', 'https://treetion.com'];
  
  console.log('CORS origins configured:', corsOrigins); // 디버깅용

  // CORS 설정 - callback 함수를 사용하여 더 명확하게 제어
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = configService.get<string>('CORS_ORIGIN')?.split(',') || 
                          ['https://www.treetion.com', 'http://localhost:3000', 'https://treetion.com'];
    
    console.log('Request origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    // null/undefined origin은 허용 (브라우저가 아닌 클라이언트)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      // 요청 거부가 아닌 허용으로 변경 (테스트 목적)
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  maxAge: 86400,
});

  // 요청 로깅 미들웨어
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    next();
  });

  // 유효성 검사 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'production', // 프로덕션에서 상세 오류 메시지 비활성화
  }));

  // Swagger는 개발 환경에서만 활성화
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Treetion API')
      .setDescription('The Treetion API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 서버 시작
  const port = configService.get<number>('PORT') || 8080;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
}
bootstrap();