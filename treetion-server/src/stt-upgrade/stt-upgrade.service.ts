import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
  
  // 텍스트 분할 설정
  private readonly MAX_CHUNK_SIZE = 1500; // 최대 청크 크기 (공백 포함 문자 수)
  private readonly PROMPT_PATH = path.join(process.cwd(), 'src', 'stt-upgrade', 'prompts', 'stt-upgrade-prompt.txt');

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
      const promptDir = path.dirname(this.PROMPT_PATH);
      await this.mkdirAsync(promptDir, { recursive: true });
      this.logger.log(`프롬프트 디렉토리 확인: ${promptDir}`);
      
      // 기본 프롬프트 파일이 없으면 생성
      if (!fs.existsSync(this.PROMPT_PATH)) {
        await this.writeFileAsync(this.PROMPT_PATH, this.getDefaultPromptTemplate());
        this.logger.log(`기본 프롬프트 파일 생성: ${this.PROMPT_PATH}`);
      }
    } catch (error) {
      this.logger.error(`디렉토리 생성 실패: ${error.message}`, error.stack);
    }
  }

  /**
   * STT 텍스트를 업그레이드합니다.
   * 
   * @param audioId 오디오 엔티티 ID
   * @param userId 사용자 ID
   * @returns 업그레이드된 텍스트 정보
   */
  async upgradeSttText(audioId: string, userId: string): Promise<any> {
    try {
      // 1. 오디오 데이터 조회
      const audioEntity = await this.audioRepository.findOne({ where: { id: audioId } });
      if (!audioEntity) {
        throw new NotFoundException(`오디오 데이터를 찾을 수 없습니다: ${audioId}`);
      }
      
      // 2. 변환된 텍스트가 없는 경우 처리
      if (!audioEntity.transcriptionText) {
        throw new InternalServerErrorException('업그레이드할 STT 텍스트가 없습니다.');
      }

      this.logger.log(`STT 업그레이드 시작: ID=${audioId}, 사용자=${userId}, 텍스트 길이=${audioEntity.transcriptionText.length}`);
      
      // 3. 텍스트를 청크로 분할
      const textChunks = this.splitTextIntoChunks(audioEntity.transcriptionText);
      this.logger.log(`텍스트를 ${textChunks.length}개의 청크로 분할 완료`);
      
      // 4. 각 청크를 LLM으로 처리
      const processedChunks = await this.processTextChunksWithLLM(textChunks);
      this.logger.log(`${processedChunks.length}개의 청크 LLM 처리 완료`);
      
      // 5. 처리된 청크 결합
      const upgradedText = processedChunks.join('');
      this.logger.log(`업그레이드된 텍스트 길이: ${upgradedText.length}`);
      
      // 6. 새 텍스트 파일을 R2에 저장
      const filename = path.basename(audioEntity.audioKey || '').split('.')[0] || 
                      audioEntity.originalFilename || 
                      `audio_${audioEntity.id}`;
                      
      const upgradedTextKey = await this.saveUpgradedTextToR2(
        upgradedText,
        userId,
        `${filename}_upgraded`
      );
      
      // 7. 오디오 엔티티 업데이트
      audioEntity.upgradedText = upgradedText;
      audioEntity.upgradedTextKey = upgradedTextKey;
      audioEntity.upgradedTextUrl = this.getTextFilePublicUrl(upgradedTextKey);
      audioEntity.isUpgraded = true;
      audioEntity.upgradedAt = new Date();
      
      const savedEntity = await this.audioRepository.save(audioEntity);
      
      // 8. 응답 생성
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
        improvedPercentage: this.calculateImprovement(
          savedEntity.transcriptionText, 
          savedEntity.upgradedText
        )
      };
    } catch (error) {
      this.logger.error(`STT 업그레이드 중 오류 발생: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 텍스트 개선율을 계산합니다.
   * 
   * @param originalText 원본 텍스트
   * @param upgradedText 업그레이드된 텍스트
   * @returns 개선율 (%)
   */
  private calculateImprovement(originalText: string, upgradedText: string): number {
    if (!originalText || !upgradedText) return 0;
    
    // 텍스트 정규화
    const normalizeText = (text: string) => {
      return text
        .replace(/\s+/g, ' ')
        .replace(/[.,;!?]+/g, '')
        .toLowerCase()
        .trim();
    };
    
    const normalizedOriginal = normalizeText(originalText);
    const normalizedUpgraded = normalizeText(upgradedText);
    
    // 변경된 문자 수 계산
    let changedChars = 0;
    const minLength = Math.min(normalizedOriginal.length, normalizedUpgraded.length);
    
    for (let i = 0; i < minLength; i++) {
      if (normalizedOriginal[i] !== normalizedUpgraded[i]) {
        changedChars++;
      }
    }
    
    // 길이 차이 반영
    changedChars += Math.abs(normalizedOriginal.length - normalizedUpgraded.length);
    
    // 변경률 계산 (최대 100%)
    const changePercentage = Math.min(
      100, 
      (changedChars / Math.max(normalizedOriginal.length, 1)) * 100
    );
    
    return Math.round(changePercentage * 10) / 10; // 소수점 한 자리까지
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
    
    // 텍스트가 없는 경우 빈 배열 반환
    if (!text || text.trim() === '') {
      return chunks;
    }
    
    // 텍스트를 문장 단위로 분할 (마침표 + 공백 또는 마침표 + 줄바꿈으로 분할)
    // 느낌표와 물음표도 문장 구분자로 추가
    const sentences = text.split(/(?<=\.[ \n])|(?<=\?[ \n])|(?<=\![ \n])/);
    
    for (let sentence of sentences) {
      // 문장이 비어있으면 건너뛰기
      if (!sentence.trim()) continue;
      
      // 문장이 마침표, 느낌표, 물음표로 끝나지 않으면 마침표 추가
      if (!sentence.trim().match(/[.!?]$/)) {
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
            // 마지막 문장 종결 위치 찾기
            const lastSentenceEndIndex = this.findLastSentenceEndBeforeLimit(buffer, this.MAX_CHUNK_SIZE);
            
            if (lastSentenceEndIndex > 0) {
              // 문장 종결 위치까지 청크 저장
              chunks.push(buffer.substring(0, lastSentenceEndIndex + 1));
              // 나머지는 새 버퍼로
              buffer = buffer.substring(lastSentenceEndIndex + 1);
            } else {
              // 문장 종결 부호를 찾을 수 없으면 최대 길이에서 자름 (최후의 수단)
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
   * 주어진 최대 길이 이전의 마지막 문장 종결 부호 인덱스 찾기
   * 
   * @param text 검색할 텍스트
   * @param maxLength 최대 길이
   * @returns 마지막 문장 종결 부호 인덱스 또는 -1
   */
  private findLastSentenceEndBeforeLimit(text: string, maxLength: number): number {
    // 최대 길이까지만 검색
    const searchText = text.substring(0, maxLength);
    
    // 마지막 문장 종결 부호 찾기
    for (let i = searchText.length - 1; i >= 0; i--) {
      // 마침표, 느낌표, 물음표 찾고, 그 다음이 공백이거나 줄바꿈이거나 텍스트의 끝이면 해당 위치 반환
      if ((searchText[i] === '.' || searchText[i] === '!' || searchText[i] === '?') && 
          (i === searchText.length - 1 || 
           searchText[i + 1] === ' ' || 
           searchText[i + 1] === '\n')) {
        return i;
      }
    }
    
    return -1; // 문장 종결 부호를 찾지 못한 경우
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
   * 텍스트 청크를 LLM으로 처리합니다.
   * 
   * @param chunks 텍스트 청크 배열
   * @returns 처리된 텍스트 청크 배열
   */
  private async processTextChunksWithLLM(chunks: string[]): Promise<string[]> {
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
          const processedChunk = await this.processSingleChunkWithLLM(chunk, index, chunks.length);
          
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
   * 단일 텍스트 청크를 LLM으로 처리합니다.
   * 
   * @param chunk 처리할 텍스트 청크
   * @param chunkIndex 청크 인덱스
   * @param totalChunks 총 청크 수
   * @returns 처리된 텍스트
   */
  private async processSingleChunkWithLLM(chunk: string, chunkIndex: number, totalChunks: number): Promise<string> {
    try {
      // GPT 프롬프트 준비
      const prompt = this.prepareSttUpgradePrompt(chunk, chunkIndex, totalChunks);
      
      // GPT 호출
      const response = await this.chatGptService.sendMessage(prompt, 'gpt-4o-mini');
      
      // 응답에서 필요한 텍스트 추출
      const processedText = this.extractProcessedTextFromResponse(response);
      
      // 처리된 텍스트가 비어있거나 너무 짧은 경우 원본 반환
      if (!processedText || processedText.length < chunk.length * 0.5) {
        this.logger.warn(`청크 ${chunkIndex + 1} 처리 결과가 비정상적으로 짧습니다. 원본 사용.`);
        return chunk;
      }
      
      return processedText;
    } catch (error) {
      this.logger.error(`LLM 처리 중 오류: ${error.message}`, error.stack);
      // 오류 발생 시 원본 청크 반환
      return chunk;
    }
  }

  /**
   * STT 업그레이드를 위한 프롬프트를 준비합니다.
   * 
   * @param chunk 처리할 텍스트 청크
   * @param chunkIndex 청크 인덱스
   * @param totalChunks 총 청크 수
   * @returns GPT에 전송할 프롬프트
   */
  private prepareSttUpgradePrompt(chunk: string, chunkIndex: number, totalChunks: number): string {
    // 프롬프트 템플릿 읽기
    let promptTemplate = '';
    
    try {
      promptTemplate = fs.readFileSync(this.PROMPT_PATH, 'utf-8');
      this.logger.debug(`프롬프트 템플릿 로드 성공: ${this.PROMPT_PATH}`);
    } catch (error) {
      this.logger.warn(`프롬프트 템플릿 파일을 읽을 수 없습니다. 기본 템플릿을 사용합니다: ${error.message}`);
      promptTemplate = this.getDefaultPromptTemplate();
    }
    
    // 프롬프트 변수 치환
    return promptTemplate
      .replace(/\{\{CHUNK_TEXT\}\}/g, chunk)
      .replace(/\{\{CHUNK_INDEX\}\}/g, String(chunkIndex + 1))
      .replace(/\{\{TOTAL_CHUNKS\}\}/g, String(totalChunks));
  }

  /**
   * GPT 응답에서 처리된 텍스트를 추출합니다.
   * 
   * @param response GPT 응답
   * @returns 처리된 텍스트
   */
  private extractProcessedTextFromResponse(response: string): string {
    if (!response || response.trim() === '') {
      return '';
    }
    
    // 응답에서 텍스트 추출 (마크다운 블록이나 특수 태그가 있을 경우 처리)
    
    // 1. 코드 블록 확인
    const codeBlockMatch = response.match(/```(?:text)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    
    // 2. 특수 태그 확인
    const tagMatch = response.match(/<upgraded_text>([\s\S]*?)<\/upgraded_text>/);
    if (tagMatch && tagMatch[1]) {
      return tagMatch[1].trim();
    }
    
    // 3. 구분선 이후 텍스트 확인
    const separatorMatch = response.match(/(?:수정된 텍스트(:)?|변환 결과(:)?|결과(:)?)\s*\n+([\s\S]+)/i);
    if (separatorMatch && separatorMatch[4]) {
      return separatorMatch[4].trim();
    }
    
    // 4. 그 외의 경우 전체 텍스트 반환 (첫 줄이 지시사항인 경우 제외)
    const lines = response.trim().split('\n');
    if (lines.length > 1 && lines[0].match(/^(수정된 텍스트|변환 결과|결과):/i)) {
      return lines.slice(1).join('\n').trim();
    }
    
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
10. 원본 텍스트와 형식이 최대한 유사하게 유지하세요.
11. 문장 간의 자연스러운 연결과 논리적 흐름을 개선하세요.

### 중요 규칙:
- 원본 텍스트에 없는 새로운 정보를 추가하지 마세요.
- 원본 텍스트의 의미를 변경하지 마세요.
- 태그나 마크다운 없이 순수 텍스트만 반환하세요.
- 설명이나 이유를 포함하지 말고 개선된 텍스트만 반환하세요.

### 수정된 텍스트:
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
      this.logger.log(`업그레이드된 텍스트 파일 R2 저장 시작`);
      
      // R2에 텍스트 파일 업로드
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: textKey,
          Body: text,
          ContentType: 'text/plain; charset=utf-8',
        })
      );
      
      this.logger.log(`업그레이드된 텍스트 파일 R2 저장 완료`);
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
}