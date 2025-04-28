// src/storage/providers/supabase-storage.provider.ts
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { StorageProviderInterface } from '../../interfaces/storage-provider.interface';

export class SupabaseStorageProvider implements StorageProviderInterface {
  private readonly supabase;
  private readonly logger = new Logger(SupabaseStorageProvider.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ path: string }> {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType,
        });

      if (error) {
        throw new Error(error.message);
      }

      return { path: data.path };
    } catch (error) {
      this.logger.error(`Supabase 파일 업로드 실패: ${error.message}`, error.stack);
      throw new Error(`Supabase 업로드 실패: ${error.message}`);
    }
  }

  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      this.logger.error(`Supabase 파일 삭제 실패: ${error.message}`, error.stack);
      throw new Error(`Supabase 파일 삭제 실패: ${error.message}`);
    }
  }

  getPublicUrl(bucketName: string, fileName: string): string {
    const { data } = this.supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
}