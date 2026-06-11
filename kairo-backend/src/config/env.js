import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    models: {
      chat: process.env.DEFAULT_CHAT_MODEL || 'qwen2.5:7b',
      coder: process.env.DEFAULT_CODER_MODEL || 'qwen2.5-coder:14b'
    }
  },
  database: {
    path: process.env.DATABASE_PATH || './database/kairo.db'
  }
};

// Quick structural sanity check
if (!process.env.OLLAMA_BASE_URL) {
  console.warn('OLLAMA_BASE_URL not explicitly set. Defaulting to local port 11434.');
}