// src/config/db.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

// 환경 변수 로드
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// 데이터베이스 설정을 함수로 등록
export default registerAs('database', (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'default_username',
    password: process.env.DB_PASSWORD || 'default_password',
    database: process.env.DB_DATABASE || 'default_database',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    ssl: {
      rejectUnauthorized: false, // 자체 서명된 인증서 허용
    },
    // connectTimeout: 30000,
    retryAttempts: 5,
    retryDelay: 3000,
    logging: process.env.NODE_ENV !== 'production',
    autoLoadEntities: true,
  };
});

// 기존 형태의 설정도 유지 (하위 호환성)
export const dbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'default_username',
  password: process.env.DB_PASSWORD || 'default_password',
  database: process.env.DB_DATABASE || 'default_database',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  ssl: {
    rejectUnauthorized: true
  },
  // connectTimeout: 30000,
  retryAttempts: 5,
  retryDelay: 3000,
  logging: process.env.NODE_ENV !== 'production',
  autoLoadEntities: true,
};