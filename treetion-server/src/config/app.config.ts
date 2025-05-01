// src/config/app.config.ts
import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default registerAs('app', () => ({
  // 앱 일반 설정
  name: process.env.APP_NAME || 'Treetion',
  port: parseInt(process.env.PORT || '8080', 10),
  env: process.env.NODE_ENV || 'development',
  
  // 업로드 설정
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000', 10), // 500MB
    maxDuration: parseInt(process.env.MAX_DURATION || '18000', 10), // 5시간
  },
  
  // 제한 설정
  limits: {
    storage: parseInt(process.env.STORAGE_LIMIT || '5368709120', 10), // 5GB
    transcription: parseInt(process.env.TRANSCRIPTION_LIMIT || '36000', 10), // 10시간
  },
  
  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // CORS 설정
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
}));