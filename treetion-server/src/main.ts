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

  // 간단한 CORS 설정
  app.enableCors({
    origin: '*', // 모든 출처 허용 (테스트용)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
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
  console.log(`Application is running on port ${port}`);
}
bootstrap();