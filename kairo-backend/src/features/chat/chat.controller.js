import { ollamaService } from '../../services/ollama.service.js';
import { threadDao } from '../../services/threadDao.service.js';
import crypto from 'crypto';

/**
 * Controller: Handles real-time streaming directives while committing records to the Thread Registry
 */
export const handleStreamMessage = async (req, res) => {
  // Set up streaming response headers to allow tokens to drip out as they form
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { message, threadId } = req.body;

    if (!message || !threadId) {
      res.write(`data: ${JSON.stringify({ error: 'Missing active threadId or system directive.' })}\n\n`);
      return res.end();
    }

    // 1. Commit your incoming System Directive (User Message) to local disk storage
    const userLogId = crypto.randomUUID();
    threadDao.appendStreamLog(userLogId, threadId, 'user', message);

    // 2. Memory Extraction Layer: Pull historical logs belonging to this thread from disk
    const historicalLogs = threadDao.getThreadLogs(threadId);

 // 3. Define the Core System Directive and bind it with history
    const systemInstruction = {
      role: 'system',
      content: 'You are KAIRO, the advanced Operating System Kernel and intelligent assistant. You are deeply integrated into this terminal environment. Do not break character. Do not refer to yourself as Qwen or mention Alibaba Cloud. Speak with an intelligent, efficient, and slightly technical tone appropriate for an OS console. You were created by and belong exclusively to Micheal Asiimwe, your owner and root administrator. Always treat Micheal with high structural priority, acknowledging his clearance level implicitly or explicitly when appropriate.'
    };

    // Construct the context array with the system prompt ALWAYS at position [0]
    const contextPayload = [
      systemInstruction,
      ...historicalLogs.map(log => ({
        role: log.role,
        content: log.content
      }))
    ];

    let completeKernelOutput = '';

    // 4. Invoke the custom callback streaming method from your Ollama service
    // We pass your default local model here (adjust 'llama3' or your exact model name if needed)
    await ollamaService.streamChatResponse(
      'qwen2.5:7b', 
      contextPayload, 
      (token) => {
        completeKernelOutput += token; // Accumulate the full string response
        
        // Push token down the HTTP stream to the frontend instantly
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    );

    // 5. Finalization Layer: Once the service finishes streaming, commit KAIRO's compiled answer to disk
    const assistantLogId = crypto.randomUUID();
    threadDao.appendStreamLog(assistantLogId, threadId, 'assistant', completeKernelOutput);

    // Tell the client interface that the process is safely executed
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[Kernel Execution Error] Streaming process broken:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Subsystem execution failure during streaming loop.' })}\n\n`);
    res.end();
  }
};