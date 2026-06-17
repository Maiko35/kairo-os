import express from 'express';
import { threadDao } from '../services/threadDao.service.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Endpoint: POST /api/threads
 * Action: Initializes a new execution thread environment
 */
router.post('/', (req, res) => {
  try {
    const { title, agentFirmware } = req.body || {};
    
    // Fallback configurations if the directive omits details
    const threadId = crypto.randomUUID();
    const threadTitle = title || `System Thread [${threadId.substring(0, 8)}]`;
    const firmware = agentFirmware || 'core_assistant';

    // Commit initialization parameters to disk storage
    threadDao.createThread(threadId, threadTitle, firmware);

    res.status(201).json({
      success: true,
      message: 'System thread environment initialized cleanly.',
      data: { id: threadId, title: threadTitle, agentFirmware: firmware }
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