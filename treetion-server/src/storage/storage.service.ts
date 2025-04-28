// src/storage/storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProviderType } from './enums/storage-provider.enum';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { SupabaseStorageProvider } from './providers/supabase-storage.provider';
import { StorageProviderInterface } from '../interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProviderInterface;
  private readonly providerType: StorageProviderType;

  constructor(private configService: ConfigService) {
    // 환경설정에서 스토리지 제공자 타입을 가져옴
    this.providerType = this.configService.get<StorageProviderType>(
      'STORAGE_PROVIDER',
      StorageProviderType.R2, // 기본값은 R2
    );

    // 스토리지 제공자 인스턴스 생성
    this.initProvider();
    this.logger.log(`스토리지 제공자 초기화: ${this.providerType}`);
  }

  private initProvider(): void {
    switch (this.providerType) {
      case StorageProviderType.R2:
        this.provider = new R2StorageProvider(this.configService);
        break;
      case StorageProviderType.SUPABASE:
        this.provider = new SupabaseStorageProvider(this.configService);
        break;
      default:
        this.provider = new R2StorageProvider(this.configService);
    }
  }

  /**
   * 파일을 스토리지에 업로드
   * @param bucketName 버킷 또는 폴더 이름
   * @param fileName 저장할 파일 이름
   * @param fileBuffer 파일 버퍼
   * @param contentType 콘텐츠 타입 (MIME 타입)
   * @returns 업로드 결과
   */
  async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const result = await this.provider.uploadFile(
        bucketName,
        fileName,
        fileBuffer,
        contentType,
      );
      return { success: true, path: result.path };
    } catch (error) {
      this.logger.error(
        `파일 업로드 실패: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * 파일의 공개 URL 반환
   * @param bucketName 버킷 또는 폴더 이름
   * @param fileName 파일 이름
   * @returns 공개 URL
   */
  getPublicUrl(bucketName: string, fileName: string): string {
    return this.provider.getPublicUrl(bucketName, fileName);
  }

  /**
   * 스토리지에서 파일 삭제
   * @param bucketName 버킷 또는 폴더 이름
   * @param fileName 파일 이름
   * @returns 삭제 결과
   */
  async deleteFile(
    bucketName: string,
    fileName: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.provider.deleteFile(bucketName, fileName);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `파일 삭제 실패 (${bucketName}/${fileName}): ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }
}