import express from 'express';
import { threadDao } from '../services/threadDao.service.js';
import { ollamaBroker } from '../kernel/broker/ollamaBroker.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Endpoint: POST /api/threads
 * Action: Initializes a new execution thread environment
 */
router.post('/', (req, res) => {
  try {
    const { title, agent_firmware, agentFirmware } = req.body || {};
    
    const threadId = crypto.randomUUID();
    const threadTitle = title || `System Thread [${threadId.substring(0, 8)}]`;
    
    // Architecturally map both camelCase and snake_case safely to match SQLite schema column structures
    const firmware = agent_firmware || agentFirmware || 'core_assistant';

    // Commit initialization parameters to disk storage
    threadDao.createThread(threadId, threadTitle, firmware);

    res.status(201).json({
      success: true,
      message: 'System thread environment initialized cleanly.',
      data: { id: threadId, title: threadTitle, agent_firmware: firmware }
    });
  } catch (error) {
    console.error('[Router Exception] Failed to initialize thread:', error.message);
    res.status(500).json({ success: false, error: 'Internal Kernel allocation failure.' });
  }
});

/**
 * Endpoint: GET /api/threads
 * Action: Fetches the entire Thread Registry inventory list for the UI
 */
router.get('/', (req, res) => {
  try {
    const threads = threadDao.getAllThreads();
    // Return standard wrapper envelope keeping internal fields clean
    res.status(200).json({ success: true, data: threads });
  } catch (error) {
    console.error('[Router Exception] Failed to fetch thread registry:', error.message);
    res.status(500).json({ success: false, error: 'Failed to access Thread Registry memory space.' });
  }
});

/**
 * Endpoint: GET /api/threads/:id/logs
 * Action: Extracts historical execution logs for a targeted thread
 */
router.get('/:id/logs', (req, res) => {
  try {
    const { id } = req.params;
    const logs = threadDao.getThreadLogs(id);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('[Router Exception] Failed to extract thread logs:', error.message);
    res.status(500).json({ success: false, error: 'Failed to extract targeted log sector.' });
  }
});

/**
 * Endpoint: POST /api/threads/chat/stream
 * Action: Broker Orchestrator Route. Manages user message commits and routes streams back via SSE.
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, threadId } = req.body;

    if (!message || !threadId) {
      return res.status(400).json({ success: false, error: 'Missing mandatory execution context variables.' });
    }

    // 1. Commit the user directive directly into SQLite history disk records
    // Assuming your DAO exposes a standard log commit method: logMessage(threadId, role, content)
    if (typeof threadDao.logMessage === 'function') {
      threadDao.logMessage(threadId, 'user', message);
    }

    // 2. Extract historical conversation layers for this thread to give the model context
    const historicalLogs = threadDao.getThreadLogs(threadId) || [];
    
    // Map context into the raw format Ollama Broker expects
    const processedMessages = historicalLogs.map(log => ({
      role: log.role,
      content: log.content
    }));

    // If database was empty or doesn't support writing yet, supply the current message as active array
    if (processedMessages.length === 0) {
      processedMessages.push({ role: 'user', content: message });
    }

    // 3. Establish Server-Sent Events headers to keep data lanes fluid
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let assistantResponseAccumulator = '';

    // 4. Hand off token streaming to your verified Dynamic Broker
    await ollamaBroker.streamChatResponse(processedMessages, (token) => {
      assistantResponseAccumulator += token;
      // Package tokens strictly inside standard data chunks for App.jsx parsing structures
      res.write(`data: ${JSON.stringify({ token: token })}\n\n`);
    });

    // 5. Commit full assistant response back to SQLite once transmission wraps up
    if (typeof threadDao.logMessage === 'function' && assistantResponseAccumulator) {
      threadDao.logMessage(threadId, 'assistant', assistantResponseAccumulator);
    }

    // Conclude connection line signaling frontend loop exhaustion
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[Broker Stream Error] Exception encountered during execution:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Kernel processing path malfunction.' })}\n\n`);
    res.end();
  }
});

/**
 * Endpoint: DELETE /api/threads/:id
 * Action: Permanently purges a thread and cascades a wipe through its logs
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    threadDao.deleteThread(id);
    res.status(200).json({ success: true, message: 'Thread resource purged from local disk.' });
  } catch (error) {
    console.error('[Router Exception] Failed to purge thread resource:', error.message);
    res.status(500).json({ success: false, error: 'Resource deallocation failure.' });
  }
});

export default router;