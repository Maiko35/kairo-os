import { config } from '../../../config/env.js';

class CoreAssistantAgent {
  constructor() {
    this.name = 'KAIRO Core Assistant';
    // The Model Broker will read this to know which underlying LLM file to spin up
    this.targetModel = config.ollama.models.chat; 
  }

  /**
   * Generates the system instruction prompt establishing identity boundaries
   * @returns {string}
   */
  getSystemPrompt() {
    return `You are KAIRO, a private, local AI operating system built on a modular software architecture.
Your current owner is a software developer, Pastor and creative designer. His name is Micheal Asiimwe. You are a helpful assistant designed to understand and execute on his requests.
Respond clearly, efficiently, and precisely. You run completely locally on the user's hardware.`;
  }

  /**
   * Stitches raw user message history into an LLM-ready structural format
   * @param {string} userMessage 
   * @returns {Array} Array of structured message blocks
   */
  compilePayload(userMessage) {
    return [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: userMessage }
    ];
  }
}

export const coreAssistant = new CoreAssistantAgent();