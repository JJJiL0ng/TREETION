import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ChatGptService {
  private readonly logger = new Logger(ChatGptService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('OpenAI API 키가 설정되지 않았습니다.');
    }
  }

  /**
   * OpenAI API에 메시지를 전송하고 응답을 받습니다.
   * 
   * @param prompt 전송할 프롬프트
   * @param model 사용할 모델 (gpt-4o-mini 등)
   * @param maxTokens 최대 토큰 수
   * @returns API 응답에서 추출한 텍스트
   */
  async sendMessage(
    prompt: string,
    model: string = 'gpt-4o-mini',
    maxTokens: number = 1024,
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다.');
      }

      this.logger.log(`ChatGPT API 호출: 모델=${model}, 프롬프트 길이=${prompt.length}자`);

      const response = await axios.post(
        this.apiUrl,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'STT 텍스트를 교정하고 개선하는 도우미입니다.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.3, // 낮은 온도로 일관된 결과 유도
          top_p: 1.0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
      );

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('API 응답에 올바른 형식의 데이터가 없습니다.');
      }

      const messageContent = response.data.choices[0].message.content;
      this.logger.log(`ChatGPT API 응답 수신: 길이=${messageContent.length}자`);

      return messageContent;
    } catch (error) {
      // API 오류 세부 정보 로깅
      if (error.response) {
        this.logger.error(
          `ChatGPT API 응답 오류: 상태=${error.response.status}, 데이터=${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        this.logger.error('ChatGPT API 요청 오류: 응답이 없습니다.');
      }

      throw new Error(`ChatGPT API 호출 실패: ${error.message}`);
    }
  }
}