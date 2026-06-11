const BASE_URL = 'http://localhost:5050/api';

export const apiService = {
  // Fetch the full inventory of threads for the sidebar
  async fetchThreads() {
    const res = await fetch(`${BASE_URL}/threads`);
    const json = await res.json();
    return json.data || [];
  },

  // Initialize a brand new thread environment
  async createThread(title = '', agentFirmware = 'core_assistant') {
    const res = await fetch(`${BASE_URL}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, agentFirmware })
    });
    const json = await res.json();
    return json.data;
  },

  // Extract old historical logs if a user switches threads
  async fetchThreadLogs(threadId) {
    const res = await fetch(`${BASE_URL}/threads/${threadId}/logs`);
    const json = await res.json();
    return json.data || [];
  },

  // Purge a thread and all related child data logs
  async deleteThread(threadId) {
    const res = await fetch(`${BASE_URL}/threads/${threadId}`, { method: 'DELETE' });
    return await res.json();
  }
};