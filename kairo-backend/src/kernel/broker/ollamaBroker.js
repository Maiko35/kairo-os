import { config } from '../../config/env.js';
import { kernelConfig } from '../registry/configRegistry.js'; // <-- Connects to our Runtime Configuration

class OllamaBroker {
  constructor() {
    this.baseUrl = config.ollama.baseUrl;
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Kernel Broker failed to communicate with local Ollama daemon:', error.message);
      return false;
    }
  }

  /**
   * Connects to Ollama API and streams tokens back to the caller in real-time.
   * Dynamically resolves the target model from the Runtime Configuration Registry.
   */
  async streamChatResponse(messages, onTokenCallback) {
    try {
      // DYNAMICALLY EXTRACT THE CHAT MODEL FROM OUR REGISTRY LAYER
      const targetModel = kernelConfig.get('activeChatModel');

      if (kernelConfig.get('runtimeFlags').performanceLogging) {
        console.log(`[Kernel Broker] Initializing core execution stream via model: ${targetModel}`);
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel, // <-- No longer hardcoded!
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

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const parsedChunk = JSON.parse(line);
            if (parsedChunk.message && parsedChunk.message.content) {
              onTokenCallback(parsedChunk.message.content);
            }
          } catch (parseError) {
            // Gracefully catch rare network packet chunk slices
          }
        }
      }
    } catch (error) {
      console.error('Kernel Broker execution exception:', error.message);
      throw error;
    }
  }
}

export const ollamaBroker = new OllamaBroker();