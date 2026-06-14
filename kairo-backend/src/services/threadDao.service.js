import db from './database.service.js';

/**
 * Thread Registry Data Access Object (DAO)
 * Direct system interface for executing SQL transactions on Threads and Stream Logs.
 */
export const threadDao = {
  
  /**
   * Registers a brand-new intelligence execution thread in the system database
   */
  createThread(id, title, agentFirmware) {
    const query = `
      INSERT INTO threads (id, title, agent_firmware)
      VALUES (?, ?, ?)
    `;
    const statement = db.prepare(query);
    return statement.run(id, title, agentFirmware);
  },

  /**
   * Appends a clean execution event or directive text block to a target thread log
   */
  appendStreamLog(id, threadId, role, content) {
    const query = `
      INSERT INTO stream_logs (id, thread_id, role, content)
      VALUES (?, ?, ?, ?)
    `;
    const statement = db.prepare(query);
    return statement.run(id, threadId, role, content);
  },

  /**
   * Resolves and extracts all matching log entries for a target thread, sorted chronologically
   */
  getThreadLogs(threadId) {
    const query = `
      SELECT role, content, created_at 
      FROM stream_logs 
      WHERE thread_id = ? 
      ORDER BY created_at ASC
    `;
    const statement = db.prepare(query);
    return statement.all(threadId);
  },

  /**
   * Retrieves an inventory list of all registered system threads for UI sidebar rendering
   */
  getAllThreads() {
    const query = `
      SELECT id, title, agent_firmware, updated_at 
      FROM threads 
      ORDER BY updated_at DESC
    `;
    const statement = db.prepare(query);
    return statement.all();
  },

  /**
   * Purges a thread completely. ON DELETE CASCADE cleans up the associated stream logs automatically.
   */
  deleteThread(threadId) {
    const query = `` + `
      DELETE FROM threads 
      WHERE id = ?
    `;
    const statement = db.prepare(query);
    return statement.run(threadId);
  },

  /**
   * Updates the structural title string of an established thread session.
   * Invoked out-of-band by the Kernel auto-titling routine.
   */
  updateThreadTitle(threadId, newTitle) {
    const query = `
      UPDATE threads 
      SET title = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const statement = db.prepare(query);
    return statement.run(newTitle, threadId);
  }
  
};