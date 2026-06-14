import { ollamaBroker } from '../../kernel/broker/ollamaBroker.js';
import { threadDao } from '../../services/threadDao.service.js';
import crypto from 'crypto';

/**
 * Controller: Handles real-time streaming directives while committing records to the Thread Registry
 */
export const handleStreamMessage = async (req, res) => {
  try {
   const { threadId, content, message } = req.body;
   const activeContent = content || message; // Gracefully handles either frontend naming convention
    
    // 1. Core Verification Layer: Check if this is the foundational user message for a new thread
    // We check this BEFORE adding the brand new user message to the DB
    const initialHistoryCheck = threadDao.getThreadLogs(threadId);
    const isFirstMessage = initialHistoryCheck.length === 0;

    // Set up streaming response headers to allow tokens to drip out as they form
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 2. Commit your incoming System Directive (User Message) to local disk storage
    const userLogId = crypto.randomUUID();
    threadDao.appendStreamLog(userLogId, threadId, 'user', activeContent);

    // 3. Memory Extraction Layer: Pull the updated historical logs belonging to this thread from disk
    const historicalLogs = threadDao.getThreadLogs(threadId);

    // 4. Define the Core System Directive
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

    // 5. Invoke the custom callback streaming method from your new Kernel Broker
    await ollamaBroker.streamChatResponse(
      contextPayload, 
      (token) => {
        completeKernelOutput += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    );

    // 6. Finalization Layer: Once the service finishes streaming, commit KAIRO's compiled answer to disk
    const assistantLogId = crypto.randomUUID();
    threadDao.appendStreamLog(assistantLogId, threadId, 'assistant', completeKernelOutput);

    // Tell the client interface that the process is safely executed
    res.write('data: [DONE]\n\n');
    res.end();

    // =========================================================================
    // DYNAMIC THREAD AUTO-TITLING SUB-ROUTINE (Asynchronous Background Execution)
    // =========================================================================
    if (isFirstMessage) {
      // Execute this out-of-band so the user doesn't wait on UI updates
      process.nextTick(async () => {
        try {
          console.log(`[Kernel Subsystem] Triggering background auto-titling for thread: ${threadId}`);
          
          // Build a targeted summary instruction prompt optimized for short string outputs
          const titleGenerationPrompt = [
            {
              role: 'system',
              content: 'You are a precise system utility kernel module. Analyze the user message and generate a clean, context-aware thread title. It must be strictly between 2 to 4 words. Do not use quotes, punctuation, or conversational intros. Return only the title text itself.'
            },
            {
              role: 'user',
              content: `Summarize this system instruction into a 2-4 word title: "${activeContent}"`
            }
          ];

          let structuralTitle = '';
          
          // We invoke the broker to generate the summary
          await ollamaBroker.streamChatResponse(titleGenerationPrompt, (token) => {
            structuralTitle += token;
          });

          // Standardize text strings by stripping enclosing quotes or stray newlines
          const cleanTitle = structuralTitle.replace(/["']/g, '').trim();

       if (cleanTitle) {
            // Clean, decoupled interface execution
            threadDao.updateThreadTitle(threadId, cleanTitle);
            console.log(`[Database Subsystem] Thread ${threadId} successfully renamed to: "${cleanTitle}"`);
          }

        } catch (titleError) {
          console.error('[Kernel Subsystem Error] Auto-titling execution failed:', titleError.message);
        }
      });
    }

  } catch (error) {
    console.error('[Kernel Execution Error] Streaming process broken:', error.message);
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Subsystem execution failure during streaming loop.' })}\n\n`);
      res.end();
    }
  }
};