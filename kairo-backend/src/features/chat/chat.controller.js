import { coreAssistant } from '../agents/implementations/coreAssistant.js';
import { ollamaService } from '../../services/ollama.service.js';

export const handleStreamMessage = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message field is required.' });
  }

  // 1. Set SSE headers so the client knows a text stream is incoming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 2. Fetch system configurations and structured payloads from our Agent layer
    const targetModel = coreAssistant.targetModel;
    const compiledMessages = coreAssistant.compilePayload(message);

    // 3. Initiate the streaming cycle through our Model Broker
    await ollamaService.streamChatResponse(
      targetModel,
      compiledMessages,
      (token) => {
        // Format payload to comply with standard SSE specification
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    );

    // 4. Close the stream cleanly once execution finishes completely
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Chat controller routing failure:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Internal pipeline execution fault.' })}\n\n`);
    res.end();
  }
};