// src/storage/interfaces/storage-provider.interface.ts
export interface StorageProviderInterface {
    /**
     * 파일을 스토리지에 업로드
     * @param bucketName 버킷 또는 폴더 이름
     * @param fileName 저장할 파일 이름
     * @param fileBuffer 파일 버퍼
     * @param contentType 콘텐츠 타입 (MIME 타입)
     * @returns 업로드 결과 (경로 포함)
     */
    uploadFile(
      bucketName: string,
      fileName: string,
      fileBuffer: Buffer,
      contentType: string,
    ): Promise<{ path: string }>;
  
    /**
     * 스토리지에서 파일 삭제
     * @param bucketName 버킷 또는 폴더 이름
     * @param fileName 파일 이름
     */
    deleteFile(bucketName: string, fileName: string): Promise<void>;
  /**
   * 파일의 공개 URL 반환
   * @param bucketName 버킷 또는 폴더 이름
   * @param fileName 파일 이름
   * @returns 공개 URL
   */
  getPublicUrl(bucketName: string, fileName: string): string;
}