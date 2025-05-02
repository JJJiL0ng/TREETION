// src/config/db.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

// 환경 변수 로드
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// 데이터베이스 설정을 함수로 등록
export default registerAs('database', (): TypeOrmModuleOptions => {
  console.log('DATABASE CONFIG LOADED');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_DATABASE:', process.env.DB_DATABASE);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'default_username',
    password: process.env.DB_PASSWORD || 'default_password',
    database: process.env.DB_DATABASE || 'default_database',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    ssl: true, // 간단하게 true로 설정
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
  ssl: true, // 간단하게 true로 설정
  // connectTimeout: 30000,
  retryAttempts: 5,
  retryDelay: 3000,
  logging: process.env.NODE_ENV !== 'production',
  autoLoadEntities: true,
};