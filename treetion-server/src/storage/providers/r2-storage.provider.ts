// src/storage/providers/r2-storage.provider.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { StorageProviderInterface } from '../../interfaces/storage-provider.interface';

export class R2StorageProvider implements StorageProviderInterface {
  private readonly s3Client: S3Client;
  private readonly publicUrl: string;
  private readonly logger = new Logger(R2StorageProvider.name);

  constructor(private configService: ConfigService) {
    // Cloudflare R2 설정
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    if (!accountId || !accessKeyId || !secretAccessKey || !this.publicUrl) {
      throw new Error('Cloudflare R2 환경 변수가 올바르게 설정되지 않았습니다.');
    }

    // S3 호환 클라이언트 생성
    this.s3Client = new S3Client({
      region: 'auto', // Cloudflare R2는 'auto' 리전 사용
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Cloudflare R2에 파일 업로드
   */
  async uploadFile(
    bucketName: string, 
    fileName: string, 
    fileBuffer: Buffer, 
    contentType: string
  ): Promise<{ path: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        // 필요한 경우 추가 옵션 설정
        // ACL: 'public-read', // R2 설정에 따라 필요할 수 있음
      });

      await this.s3Client.send(command);
      return { path: `${bucketName}/${fileName}` };
    } catch (error) {
      this.logger.error(`R2 파일 업로드 실패: ${error.message}`, error.stack);
      throw new Error(`Cloudflare R2 업로드 실패: ${error.message}`);
    }
  }

  /**
   * Cloudflare R2에서 파일 삭제
   */
  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`R2 파일 삭제 실패: ${error.message}`, error.stack);
      throw new Error(`Cloudflare R2 파일 삭제 실패: ${error.message}`);
    }
  }

  /**
   * Cloudflare R2 파일의 공개 URL 생성
   */
  getPublicUrl(bucketName: string, fileName: string): string {
    // 설정된 공개 URL 기반으로 파일 URL 생성
    // 예: https://media.example.com/audio/file.mp3
    return `${this.publicUrl.replace(/\/+$/, '')}/${bucketName}/${fileName}`;
  }
}