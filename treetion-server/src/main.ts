import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS 설정
  const corsOrigins = configService.get<string>('CORS_ORIGIN')?.split(',') || 
                     ['https://www.treetion.com', 'http://localhost:3000', 'https://treetion.com'];
  
  console.log('CORS origins configured:', corsOrigins); // 디버깅용

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: configService.get<boolean>('CORS_CREDENTIALS') || true,
    maxAge: 86400, // 24시간 preflight 캐시
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
  }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Treetion API')
    .setDescription('The Treetion API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 서버 시작
  const port = configService.get<number>('PORT') || 8080;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
}
bootstrap();