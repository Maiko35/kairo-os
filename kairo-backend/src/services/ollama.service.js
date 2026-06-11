import { config } from '../config/env.js';

class OllamaService {
  constructor() {
    this.baseUrl = config.ollama.baseUrl;
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Model Broker failed to establish communication with local Ollama daemon:', error.message);
      return false;
    }
  }

  /**
   * Connects to Ollama API and streams tokens back to the caller in real-time
   * @param {string} model 
   * @param {Array} messages 
   * @param {Function} onTokenCallback - Executed every time a new text character arrives
   */
  async streamChatResponse(model, messages, onTokenCallback) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama downstream communication error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the stream block and append it to our temporary text buffer
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Save the last partial line back to the buffer
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const parsedChunk = JSON.parse(line);
            if (parsedChunk.message && parsedChunk.message.content) {
              // Extract raw token and send it straight up to our callback handler
              onTokenCallback(parsedChunk.message.content);
            }
          } catch (parseError) {
            console.error('Error parsing streaming JSON line chunk:', parseError.message);
          }
        }
      }
    } catch (error) {
      console.error('Model Broker execution exception:', error.message);
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();