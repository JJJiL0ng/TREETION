// src/config/api.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('api', () => ({
  // Clova STT API 설정
  clova: {
    endpoint: process.env.CLOVA_API_ENDPOINT,
    secretKey: process.env.CLOVA_SECRET_KEY,
    invokeUrl: process.env.CLOVA_INVOKE_URL,
  },
  
  // Claude API 설정
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    apiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1',
    model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
    // maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS, 10) || 4000,
  },
}));