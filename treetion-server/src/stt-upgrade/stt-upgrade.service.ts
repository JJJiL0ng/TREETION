import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { S3, PutObjectCommand } from '@aws-sdk/client-s3';
import { AudioEntity } from '../audio/entities/audio.entity';
import { ChatGptService } from '../chat-gpt/chat-gpt.service';

@Injectable()
export class SttUpgradeService {
  private readonly logger = new Logger(SttUpgradeService.name);
  private readonly readFileAsync = promisify(fs.readFile);
  private readonly writeFileAsync = promisify(fs.writeFile);
  private readonly mkdirAsync = promisify(fs.mkdir);
  private readonly unlinkAsync = promisify(fs.unlink);
  private readonly s3Client: S3;
  private readonly TEMP_DIR = path.join(process.cwd(), 'temp', 'stt-upgrade');
  private readonly PROMPTS_DIR = path.join(process.cwd(), 'src', 'stt-upgrade', 'prompts');
  
  // 텍스트 분할 설정
  private readonly MAX_CHUNK_SIZE = 1500; // 최대 청크 크기 (공백 포함 문자 수)

  constructor(
    @InjectRepository(AudioEntity)
    private readonly audioRepository: Repository<AudioEntity>,
    private readonly configService: ConfigService,
    private readonly chatGptService: ChatGptService,
  ) {
    // R2 클라이언트 초기화
    this.s3Client = new S3({
      region: 'auto',
      endpoint: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
    
    // 임시 디렉토리 및 프롬프트 디렉토리 생성
    this.ensureDirectories();
  }

  /**
   * 필요한 디렉토리가 존재하는지 확인하고, 없으면 생성합니다.
   */
  private async ensureDirectories(): Promise<void> {
    try {
      // 임시 디렉토리 생성
      await this.mkdirAsync(this.TEMP_DIR, { recursive: true });
      this.logger.log(`임시 디렉토리 확인: ${this.TEMP_DIR}`);
      
      // 프롬프트 디렉토리 생성
      await this.mkdirAsync(this.PROMPTS_DIR, { recursive: true });
      this.logger.log(`프롬프트 디렉토리 확인: ${this.PROMPTS_DIR}`);
      
      // 기본 프롬프트 파일이 없으면 생성
      const defaultPromptPath = path.join(this.PROMPTS_DIR, 'default-prompt.txt');
      if (!fs.existsSync(defaultPromptPath)) {
        await this.writeFileAsync(defaultPromptPath, this.getDefaultPromptTemplate());
        this.logger.log(`기본 프롬프트 파일 생성: ${defaultPromptPath}`);
      }
    } catch (error) {
      this.logger.error(`디렉토리 생성 실패: ${error.message}`, error.stack);
    }
  }

  /**
   * 사용 가능한 프롬프트 템플릿 목록을 반환합니다.
   */
  async getAvailablePromptTemplates(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.PROMPTS_DIR);
      return files.filter(file => file.endsWith('.txt'));
    } catch (error) {
      this.logger.error(`프롬프트 템플릿 목록 조회 실패: ${error.message}`, error.stack);
      return ['default-prompt.txt'];
    }
  }

  /**
   * 지정된 프롬프트 템플릿의 내용을 반환합니다.
   */
  async getPromptTemplate(templateName: string = 'default-prompt.txt'): Promise<string> {
    try {
      const templatePath = path.join(this.PROMPTS_DIR, templateName);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`프롬프트 템플릿을 찾을 수 없습니다: ${templateName}`);
      }
      
      return await this.readFileAsync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(`프롬프트 템플릿 읽기 실패: ${error.message}`, error.stack);
      return this.getDefaultPromptTemplate();
    }
  }

  /**
   * 새 프롬프트 템플릿을 저장합니다.
   */
  async savePromptTemplate(templateName: string, content: string): Promise<string> {
    try {
      // 파일명에 .txt 확장자가 없으면 추가
      const fileName = templateName.endsWith('.txt') ? templateName : `${templateName}.txt`;
      const templatePath = path.join(this.PROMPTS_DIR, fileName);
      
      await this.writeFileAsync(templatePath, content);
      this.logger.log(`프롬프트 템플릿 저장 완료: ${templatePath}`);
      
      return fileName;
    } catch (error) {
      this.logger.error(`프롬프트 템플릿 저장 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STT 텍스트를 기본 프롬프트로 업그레이드합니다.
   * 
   * @param audioId 오디오 엔티티 ID
   * @param userId 사용자 ID
   * @returns 업그레이드된 텍스트 정보
   */
  async upgradeSttText(audioId: string, userId: string): Promise<any> {
    return this.upgradeSttTextWithTemplate(audioId, userId, 'default-prompt.txt');
  }

  /**
   * STT 텍스트를 지정된 프롬프트 템플릿으로 업그레이드합니다.
   * 
   * @param audioId 오디오 엔티티 ID
   * @param userId 사용자 ID
   * @param templateName 프롬프트 템플릿 이름
   * @returns 업그레이드된 텍스트 정보
   */
  async upgradeSttTextWithTemplate(
    audioId: string,
    userId: string,
    templateName: string = 'default-prompt.txt'
  ): Promise<any> {
    try {
      // 1. 오디오 데이터 조회
      const audioEntity = await this.audioRepository.findOne({ where: { id: audioId } });
      if (!audioEntity) {
        throw new Error(`오디오 데이터를 찾을 수 없습니다: ${audioId}`);
      }

      if (!audioEntity.transcriptionText) {
        throw new Error(`오디오에 변환된 텍스트가 없습니다: ${audioId}`);
      }

      this.logger.log(`STT 업그레이드 시작: ID=${audioId}, 사용자=${userId}, 템플릿=${templateName}, 텍스트 길이=${audioEntity.transcriptionText.length}`);
      
      // 2. 프롬프트 템플릿 로드
      const promptTemplate = await this.getPromptTemplate(templateName);
      
      // 3. 텍스트를 청크로 분할
      const textChunks = this.splitTextIntoChunks(audioEntity.transcriptionText);
      this.logger.log(`텍스트를 ${textChunks.length}개의 청크로 분할 완료`);
      
      // 4. 각 청크를 LLM으로 처리
      const processedChunks = await this.processTextChunksWithTemplate(textChunks, promptTemplate);
      this.logger.log(`${processedChunks.length}개의 청크 LLM 처리 완료`);
      
      // 5. 처리된 청크 결합
      const upgradedText = processedChunks.join('');
      this.logger.log(`업그레이드된 텍스트 길이: ${upgradedText.length}`);
      
      // 6. 새 텍스트 파일을 R2에 저장
      const baseName = path.basename(audioEntity.audioKey || 'audio', path.extname(audioEntity.audioKey || '.audio'));
      const upgradedTextKey = await this.saveUpgradedTextToR2(
        upgradedText,
        userId,
        `${baseName}_upgraded`
      );
      
      // 7. 오디오 엔티티 업데이트
      audioEntity.upgradedText = upgradedText;
      audioEntity.upgradedTextKey = upgradedTextKey;
      audioEntity.upgradedTextUrl = this.getTextFilePublicUrl(upgradedTextKey);
      audioEntity.isUpgraded = true;
      audioEntity.upgradedAt = new Date();
      
      const savedEntity = await this.audioRepository.save(audioEntity);
      
      return {
        id: savedEntity.id,
        title: savedEntity.title,
        originalText: savedEntity.transcriptionText,
        upgradedText: savedEntity.upgradedText,
        upgradedTextUrl: savedEntity.upgradedTextUrl,
        originalLength: savedEntity.transcriptionText.length,
        upgradedLength: savedEntity.upgradedText.length,
        chunkCount: textChunks.length,
        upgradedAt: savedEntity.upgradedAt,
        templateUsed: templateName,
      };
    } catch (error) {
      this.logger.error(`STT 업그레이드 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STT 텍스트를 사용자 정의 프롬프트로 업그레이드합니다.
   * 
   * @param audioId 오디오 엔티티 ID
   * @param userId 사용자 ID
   * @param customPrompt 사용자 정의 프롬프트
   * @returns 업그레이드된 텍스트 정보
   */
  async upgradeSttTextWithCustomPrompt(
    audioId: string,
    userId: string,
    customPrompt: string
  ): Promise<any> {
    try {
      // 1. 오디오 데이터 조회
      const audioEntity = await this.audioRepository.findOne({ where: { id: audioId } });
      if (!audioEntity) {
        throw new Error(`오디오 데이터를 찾을 수 없습니다: ${audioId}`);
      }

      if (!audioEntity.transcriptionText) {
        throw new Error(`오디오에 변환된 텍스트가 없습니다: ${audioId}`);
      }

      this.logger.log(`사용자 정의 프롬프트로 STT 업그레이드 시작: ID=${audioId}, 사용자=${userId}, 텍스트 길이=${audioEntity.transcriptionText.length}`);
      
      // 2. 텍스트를 청크로 분할
      const textChunks = this.splitTextIntoChunks(audioEntity.transcriptionText);
      this.logger.log(`텍스트를 ${textChunks.length}개의 청크로 분할 완료`);
      
      // 3. 사용자 정의 프롬프트 저장 (향후 재사용을 위해)
      const promptFilename = `custom-${userId}-${Date.now()}.txt`;
      await this.savePromptTemplate(promptFilename, customPrompt);
      
      // 4. 각 청크를 LLM으로 처리
      const processedChunks = await this.processTextChunksWithTemplate(textChunks, customPrompt);
      this.logger.log(`${processedChunks.length}개의 청크 LLM 처리 완료`);
      
      // 5. 처리된 청크 결합
      const upgradedText = processedChunks.join('');
      this.logger.log(`업그레이드된 텍스트 길이: ${upgradedText.length}`);
      
      // 6. 새 텍스트 파일을 R2에 저장
      const baseName = path.basename(audioEntity.audioKey || 'audio', path.extname(audioEntity.audioKey || '.audio'));
      const upgradedTextKey = await this.saveUpgradedTextToR2(
        upgradedText,
        userId,
        `${baseName}_upgraded_custom`
      );
      
      // 7. 오디오 엔티티 업데이트
      audioEntity.upgradedText = upgradedText;
      audioEntity.upgradedTextKey = upgradedTextKey;
      audioEntity.upgradedTextUrl = this.getTextFilePublicUrl(upgradedTextKey);
      audioEntity.isUpgraded = true;
      audioEntity.upgradedAt = new Date();
      
      const savedEntity = await this.audioRepository.save(audioEntity);
      
      return {
        id: savedEntity.id,
        title: savedEntity.title,
        originalText: savedEntity.transcriptionText,
        upgradedText: savedEntity.upgradedText,
        upgradedTextUrl: savedEntity.upgradedTextUrl,
        originalLength: savedEntity.transcriptionText.length,
        upgradedLength: savedEntity.upgradedText.length,
        chunkCount: textChunks.length,
        upgradedAt: savedEntity.upgradedAt,
        templateUsed: 'custom',
      };
    } catch (error) {
      this.logger.error(`사용자 정의 프롬프트로 STT 업그레이드 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 텍스트를 최대 길이를 초과하지 않는 청크로 분할합니다.
   * 마침표로 끝나는 문장 단위로 분할합니다.
   * 
   * @param text 분할할 텍스트
   * @returns 분할된 텍스트 청크 배열
   */
  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let buffer = '';
    
    // 텍스트를 문장 단위로 분할 (마침표 + 공백 또는 마침표 + 줄바꿈으로 분할)
    const sentences = text.split(/(?<=\.\s)|(?<=\.\n)/);
    
    for (let sentence of sentences) {
      // 문장이 비어있으면 건너뛰기
      if (!sentence.trim()) continue;
      
      // 문장이 마침표로 끝나지 않으면 마침표 추가
      if (!sentence.trim().endsWith('.')) {
        sentence = sentence.trim() + '.';
      }
      
      // 현재 청크 + 버퍼 + 현재 문장이 최대 길이를 초과하는지 검사
      if ((currentChunk + buffer + sentence).length > this.MAX_CHUNK_SIZE) {
        if (currentChunk) {
          // 현재 청크가 있으면 저장
          chunks.push(currentChunk);
          // 버퍼와 현재 문장을 새 청크로 설정
          currentChunk = buffer + sentence;
          buffer = '';
        } else {
          // 현재 청크가 없는 경우 (버퍼만 있는 경우)
          // 버퍼가 최대 길이를 초과하면 강제 분할
          if (buffer.length >= this.MAX_CHUNK_SIZE) {
            // 마지막 마침표 위치 찾기
            const lastPeriodIndex = this.findLastPeriodBeforeLimit(buffer, this.MAX_CHUNK_SIZE);
            
            if (lastPeriodIndex > 0) {
              // 마침표 위치까지 청크 저장
              chunks.push(buffer.substring(0, lastPeriodIndex + 1));
              // 나머지는 새 버퍼로
              buffer = buffer.substring(lastPeriodIndex + 1);
            } else {
              // 마침표를 찾을 수 없으면 그냥 최대 길이에서 자름 (최후의 수단)
              chunks.push(buffer.substring(0, this.MAX_CHUNK_SIZE));
              buffer = buffer.substring(this.MAX_CHUNK_SIZE);
            }
          }
          
          // 버퍼와 현재 문장을 새 청크로 설정
          currentChunk = buffer + sentence;
          buffer = '';
        }
      } else {
        // 최대 길이를 초과하지 않으면 버퍼에 현재 문장 추가
        buffer += sentence;
      }
    }
    
    // 남은 텍스트 처리
    if (buffer || currentChunk) {
      chunks.push(currentChunk + buffer);
    }
    
    return chunks;
  }
  
  /**
   * 주어진 최대 길이 이전의 마지막 마침표 인덱스 찾기
   * 
   * @param text 검색할 텍스트
   * @param maxLength 최대 길이
   * @returns 마지막 마침표 인덱스 또는 -1
   */
  private findLastPeriodBeforeLimit(text: string, maxLength: number): number {
    // 최대 길이까지만 검색
    const searchText = text.substring(0, maxLength);
    
    // 마지막 마침표 찾기
    for (let i = searchText.length - 1; i >= 0; i--) {
      // 마침표 찾고, 그 다음이 공백이거나 줄바꿈이거나 텍스트의 끝이면 해당 위치 반환
      if (searchText[i] === '.' && 
          (i === searchText.length - 1 || 
           searchText[i + 1] === ' ' || 
           searchText[i + 1] === '\n')) {
        return i;
      }
    }
    
    return -1; // 마침표를 찾지 못한 경우
  }

  /**
   * 문맥 유지를 위해 청크의 앞뒤에 중복 텍스트를 추가합니다.
   * 
   * @param chunks 원본 텍스트 청크 배열
   * @param overlapSize 중복 텍스트 크기 (문자 수)
   * @returns 중복 영역이 추가된 청크 배열
   */
  private addContextOverlap(chunks: string[], overlapSize: number = 100): { chunk: string, index: number }[] {
    return chunks.map((chunk, index) => {
      let contextChunk = chunk;
      
      // 이전 청크의 마지막 부분을 추가 (첫 번째 청크 제외)
      if (index > 0) {
        const prevChunk = chunks[index - 1];
        const prevContext = prevChunk.substring(Math.max(0, prevChunk.length - overlapSize));
        contextChunk = prevContext + contextChunk;
      }
      
      // 다음 청크의 처음 부분을 추가 (마지막 청크 제외)
      if (index < chunks.length - 1) {
        const nextChunk = chunks[index + 1];
        const nextContext = nextChunk.substring(0, Math.min(nextChunk.length, overlapSize));
        contextChunk = contextChunk + nextContext;
      }
      
      return { 
        chunk: contextChunk, 
        index 
      };
    });
  }

  /**
   * 템플릿을 사용하여 텍스트 청크를 처리합니다.
   * 
   * @param chunks 텍스트 청크 배열
   * @param promptTemplate 프롬프트 템플릿
   * @returns 처리된 텍스트 청크 배열
   */
  private async processTextChunksWithTemplate(
    chunks: string[],
    promptTemplate: string
  ): Promise<string[]> {
    // 청크에 컨텍스트 추가 (문맥 유지를 위한 중복 영역)
    const contextChunks = this.addContextOverlap(chunks);
    
    // 배치 크기 설정 (한 번에 처리할 청크 수)
    const batchSize = 3;
    const processedChunks: string[] = new Array(chunks.length).fill('');
    
    for (let i = 0; i < contextChunks.length; i += batchSize) {
      const batch = contextChunks.slice(i, i + batchSize);
      
      // 병렬 처리
      const batchPromises = batch.map(async ({ chunk, index }) => {
        try {
          this.logger.log(`청크 ${index + 1}/${chunks.length} 처리 시작, 길이: ${chunk.length}`);
          const processedChunk = await this.processSingleChunkWithTemplate(
            chunk, 
            promptTemplate, 
            index, 
            chunks.length
          );
          
          // 원본 청크 길이와 비교하여 로깅
          const originalLength = chunks[index].length;
          this.logger.log(`청크 ${index + 1} 처리 완료: 원본=${originalLength}자, 처리 후=${processedChunk.length}자`);
          
          // 원본 청크의 인덱스에 맞게 결과 저장
          processedChunks[index] = processedChunk;
          return processedChunk;
        } catch (error) {
          this.logger.error(`청크 ${index + 1} 처리 실패: ${error.message}`, error.stack);
          // 실패 시 원본 청크 반환
          processedChunks[index] = chunks[index];
          return chunks[index];
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    return processedChunks;
  }

  /**
   * 템플릿을 사용하여 단일 텍스트 청크를 처리합니다.
   * 
   * @param chunk 처리할 텍스트 청크
   * @param promptTemplate 프롬프트 템플릿
   * @param chunkIndex 청크 인덱스
   * @param totalChunks 총 청크 수
   * @returns 처리된 텍스트
   */
  private async processSingleChunkWithTemplate(
    chunk: string, 
    promptTemplate: string, 
    chunkIndex: number, 
    totalChunks: number
  ): Promise<string> {
    try {
      // 프롬프트 템플릿에 변수 치환
      const prompt = promptTemplate
        .replace(/{{CHUNK_TEXT}}/g, chunk)
        .replace(/{{CHUNK_INDEX}}/g, String(chunkIndex + 1))
        .replace(/{{TOTAL_CHUNKS}}/g, String(totalChunks));
      
      // GPT 호출
      const response = await this.chatGptService.sendMessage(prompt, 'gpt-4o-mini');
      
      // 응답에서 필요한 텍스트 추출
      return this.extractProcessedTextFromResponse(response);
    } catch (error) {
      this.logger.error(`LLM 처리 중 오류: ${error.message}`, error.stack);
      // 오류 발생 시 원본 청크 반환
      return chunk;
    }
  }

  /**
   * GPT 응답에서 처리된 텍스트를 추출합니다.
   * 
   * @param response GPT 응답
   * @returns 처리된 텍스트
   */
  private extractProcessedTextFromResponse(response: string): string {
    // 응답에서 텍스트 추출 (마크다운 블록이나 특수 태그가 있을 경우 처리)
    
    // 일반적으로 GPT는 마크다운 블록으로 코드를 반환할 수 있음
    const codeBlockMatch = response.match(/```(?:text)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    
    // 특수 포맷 태그가 있는 경우
    const tagMatch = response.match(/<upgraded_text>([\s\S]*?)<\/upgraded_text>/);
    if (tagMatch && tagMatch[1]) {
      return tagMatch[1].trim();
    }
    
    // 그 외의 경우 전체 텍스트 반환
    return response.trim();
  }

  /**
   * 기본 프롬프트 템플릿을 반환합니다.
   */
  private getDefaultPromptTemplate(): string {
    return `당신은 STT(Speech-to-Text) 품질 개선 전문가입니다. 아래 텍스트는 음성 인식 프로그램에 의해 생성된 텍스트입니다. 이 텍스트를 문맥에 맞게 교정하여 가독성과 정확성을 높여주세요.

청크 정보: {{CHUNK_INDEX}} / {{TOTAL_CHUNKS}}

### 원본 STT 텍스트:
{{CHUNK_TEXT}}

### 작업 지침:
1. 명확하지 않은 단어나 문장을 문맥에 맞게 수정하세요.
2. 적절한 문장 부호(쉼표, 마침표 등)를 추가하거나 수정하세요.
3. 반복되는 단어나 불필요한 단어를 제거하세요.
4. 띄어쓰기를 올바르게 수정하세요.
5. 문장 구조를 자연스럽게 수정하세요.
6. 원본 텍스트의 의미를 최대한 보존하세요.
7. 주어가 생략된 경우 적절히 추가하세요.
8. 존댓말과 반말이 섞여있다면 일관되게 수정하세요.
9. 전문 용어나 고유명사는 최대한 보존하세요.

### 수정된 텍스트만 반환해주세요:
`;
  }

  /**
   * 업그레이드된 텍스트를 R2에 저장합니다.
   * 
   * @param text 업그레이드된 텍스트
   * @param userId 사용자 ID
   * @param baseFilename 기본 파일명 (확장자 제외)
   * @returns 저장된 텍스트 파일의 키
   */
  private async saveUpgradedTextToR2(
    text: string,
    userId: string,
    baseFilename: string
  ): Promise<string> {
    const timestamp = Date.now();
    const textKey = `upgraded-transcriptions/${userId}/${baseFilename}_${timestamp}.txt`;
    const bucketName = this.configService.get('R2_BUCKET_NAME');
    
    try {
      this.logger.log(`업그레이드된 텍스트 파일 R2 저장 시작: ${textKey}`);
      
      // R2에 텍스트 파일 업로드
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: textKey,
          Body: text,
          ContentType: 'text/plain; charset=utf-8',
        })
      );
      
      this.logger.log(`업그레이드된 텍스트 파일 R2 저장 완료: ${textKey}`);
      return textKey;
    } catch (error) {
      this.logger.error(`텍스트 파일 R2 저장 오류: ${error.message}`, error.stack);
      throw new Error(`텍스트 파일 저장 실패: ${error.message}`);
    }
  }

  /**
   * R2에 저장된 텍스트의 공개 URL을 생성합니다.
   * 
   * @param textKey R2에 저장된 텍스트 파일의 키
   * @returns 공개 접근 가능한 URL
   */
  private getTextFilePublicUrl(textKey: string): string {
    const r2PublicUrl = this.configService.get('R2_PUBLIC_URL');
    
    // R2_PUBLIC_URL이 설정된 경우
    if (r2PublicUrl) {
      // 슬래시가 중복되지 않도록 처리
      if (r2PublicUrl.endsWith('/')) {
        return `${r2PublicUrl}${textKey}`;
      } else {
        return `${r2PublicUrl}/${textKey}`;
      }
    }
    
    // 기본 R2 URL 형식
    const accountId = this.configService.get('R2_ACCOUNT_ID');
    const bucketName = this.configService.get('R2_BUCKET_NAME');
    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${textKey}`;
  }

  /**
   * 텍스트 내용이 변경되었는지 확인합니다.
   * 
   * @param originalText 원본 텍스트
   * @param processedText 처리된 텍스트
   * @returns 변경되었는지 여부
   */
  private isTextChanged(originalText: string, processedText: string): boolean {
    // 기본적인 비교 (공백 및 줄바꿈 무시)
    const normalizedOriginal = originalText.replace(/\s+/g, ' ').trim();
    const normalizedProcessed = processedText.replace(/\s+/g, ' ').trim();
    
    // 95% 이상 동일하면 변경되지 않았다고 간주
    const similarity = this.calculateSimilarity(normalizedOriginal, normalizedProcessed);
    return similarity < 0.95;
  }

  /**
   * 두 문자열의 유사도를 계산합니다. (간단한 구현)
   * 
   * @param str1 첫 번째 문자열
   * @param str2 두 번째 문자열
   * @returns 유사도 (0~1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // 레벤슈타인 거리 대신 간단한 비교 (실제로는 더 정교한 알고리즘 사용 권장)
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    let sameChars = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        sameChars++;
      }
    }
    
    return sameChars / maxLength;
  }

  /**
   * 처리 이력을 조회합니다.
   * 
   * @param userId 사용자 ID (선택)
   * @returns 처리 이력 목록
   */
  async getUpgradeHistory(userId?: string): Promise<any[]> {
    try {
      const query = this.audioRepository.createQueryBuilder('audio')
        .select([
          'audio.id',
          'audio.title',
          'audio.userId',
          'audio.isUpgraded',
          'audio.upgradedAt',
          'audio.upgradedTextUrl'
        ])
        .where('audio.isUpgraded = :isUpgraded', { isUpgraded: true });

      // 사용자 ID가 지정된 경우 필터링
      if (userId) {
        query.andWhere('audio.userId = :userId', { userId });
      }

      // 최신순으로 정렬
      query.orderBy('audio.upgradedAt', 'DESC');

      const upgradedAudios = await query.getMany();
      
      return upgradedAudios.map(audio => ({
        id: audio.id,
        title: audio.title,
        userId: audio.userId,
        upgradedAt: audio.upgradedAt,
        upgradedTextUrl: audio.upgradedTextUrl
      }));
    } catch (error) {
      this.logger.error(`업그레이드 이력 조회 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 오디오의 업그레이드 결과를 조회합니다.
   * 
   * @param audioId 오디오 ID
   * @returns 업그레이드 결과
   */
  async getUpgradeResult(audioId: string): Promise<any> {
    try {
      const audioEntity = await this.audioRepository.findOne({ where: { id: audioId } });
      if (!audioEntity) {
        throw new Error(`오디오를 찾을 수 없습니다: ${audioId}`);
      }

      if (!audioEntity.isUpgraded) {
        throw new Error(`아직 업그레이드되지 않은 오디오입니다: ${audioId}`);
      }

      return {
        id: audioEntity.id,
        title: audioEntity.title,
        userId: audioEntity.userId,
        originalText: audioEntity.transcriptionText,
        upgradedText: audioEntity.upgradedText,
        upgradedTextUrl: audioEntity.upgradedTextUrl,
        originalLength: audioEntity.transcriptionText?.length || 0,
        upgradedLength: audioEntity.upgradedText?.length || 0,
        upgradedAt: audioEntity.upgradedAt
      };
    } catch (error) {
      this.logger.error(`업그레이드 결과 조회 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 오디오의 업그레이드 작업을 취소하고 원래 상태로 되돌립니다.
   * 
   * @param audioId 오디오 ID
   * @returns 작업 결과
   */
  async cancelUpgrade(audioId: string): Promise<any> {
    try {
      const audioEntity = await this.audioRepository.findOne({ where: { id: audioId } });
      if (!audioEntity) {
        throw new Error(`오디오를 찾을 수 없습니다: ${audioId}`);
      }

      if (!audioEntity.isUpgraded) {
        throw new Error(`업그레이드되지 않은 오디오입니다: ${audioId}`);
      }

      // 업그레이드 관련 필드 초기화
      audioEntity.upgradedText = '';
      audioEntity.upgradedTextKey = '';
      audioEntity.upgradedTextUrl = '';
      audioEntity.isUpgraded = false;
      audioEntity.upgradedAt = new Date();

      const savedEntity = await this.audioRepository.save(audioEntity);

      return {
        id: savedEntity.id,
        title: savedEntity.title,
        message: '업그레이드가 취소되었습니다.'
      };
    } catch (error) {
      this.logger.error(`업그레이드 취소 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STT 업그레이드 작업 통계 조회
   * 
   * @param userId 사용자 ID (선택)
   * @returns 통계 정보
   */
  async getUpgradeStatistics(userId?: string): Promise<any> {
    try {
      // 기본 쿼리 작성
      const queryBuilder = this.audioRepository.createQueryBuilder('audio');
      
      // 사용자별 필터링
      if (userId) {
        queryBuilder.where('audio.userId = :userId', { userId });
      }
      
      // 총 오디오 수
      const totalCount = await queryBuilder.getCount();
      
      // 업그레이드된 오디오 수
      const upgradedCount = await queryBuilder
        .where('audio.isUpgraded = :isUpgraded', { isUpgraded: true })
        .getCount();
      
      // 미업그레이드 오디오 수
      const notUpgradedCount = await queryBuilder
        .where('audio.transcriptionText IS NOT NULL')
        .andWhere('(audio.isUpgraded = :isUpgraded OR audio.isUpgraded IS NULL)', { isUpgraded: false })
        .getCount();
      
      // 업그레이드 가능한 오디오 수 (STT는 있지만 업그레이드 안된 것)
      const upgradeReadyCount = await queryBuilder
        .where('audio.transcriptionText IS NOT NULL')
        .andWhere('(audio.isUpgraded = :isUpgraded OR audio.isUpgraded IS NULL)', { isUpgraded: false })
        .getCount();
      
      // 텍스트 평균 길이 증가 비율 계산
      const lengthStats = await queryBuilder
        .select([
          'AVG(LENGTH(audio.transcriptionText)) as avgOriginalLength',
          'AVG(LENGTH(audio.upgradedText)) as avgUpgradedLength'
        ])
        .where('audio.isUpgraded = :isUpgraded', { isUpgraded: true })
        .getRawOne();
      
      const avgOriginalLength = lengthStats?.avgOriginalLength || 0;
      const avgUpgradedLength = lengthStats?.avgUpgradedLength || 0;
      let lengthChangeRatio = 0;
      
      if (avgOriginalLength > 0) {
        lengthChangeRatio = (avgUpgradedLength - avgOriginalLength) / avgOriginalLength;
      }
      
      return {
        totalAudioCount: totalCount,
        upgradedCount: upgradedCount,
        notUpgradedCount: notUpgradedCount,
        upgradeReadyCount: upgradeReadyCount,
        avgOriginalLength: Math.round(avgOriginalLength),
        avgUpgradedLength: Math.round(avgUpgradedLength),
        lengthChangeRatio: lengthChangeRatio.toFixed(2),
      };
    } catch (error) {
      this.logger.error(`통계 정보 조회 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모든 프롬프트 템플릿을 조회합니다.
   */
  async getAllPromptTemplates(): Promise<any[]> {
    try {
      const templates = await this.getAvailablePromptTemplates();
      const result: Array<{
        name: string;
        isCustom: boolean;
        preview: string;
        createdAt: Date | null;
      }> = [];
      
      for (const templateName of templates) {
        // 사용자 정의 프롬프트인지 확인 (파일명으로 판단)
        const isCustom = templateName.startsWith('custom-');
        
        // 프롬프트 내용 읽기
        const content = await this.getPromptTemplate(templateName);
        
        // 첫 100자만 미리보기로 사용
        const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        
        result.push({
          name: templateName,
          isCustom: isCustom,
          preview: preview,
          createdAt: isCustom ? this.getCreationTimeFromCustomName(templateName) : null
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`프롬프트 템플릿 목록 조회 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 사용자 정의 프롬프트 파일명에서 생성 시간을 추출합니다.
   */
  private getCreationTimeFromCustomName(fileName: string): Date | null {
    try {
      // 파일명 형식: custom-userId-timestamp.txt
      const parts = fileName.split('-');
      if (parts.length >= 3) {
        const timestampWithExt = parts[parts.length - 1];
        const timestamp = parseInt(timestampWithExt.split('.')[0]);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}