const BASE_URL = 'http://localhost:5050/api';

export const apiService = {
  BASE_URL,

  async fetchThreads() {
    const res = await fetch(`${BASE_URL}/threads`);
    return res.json();
  },

  async fetchThreadLogs(threadId) {
    const res = await fetch(`${BASE_URL}/threads/${threadId}/logs`);
    return res.json();
  },

async createThread() {
    const res = await fetch(`${BASE_URL}/threads`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Sends a valid body shell so req.body exists
    });
    return res.json();
  },

  async deleteThread(threadId) {
    const res = await fetch(`${BASE_URL}/threads/${threadId}`, { method: 'DELETE' });
    return res.json();
  }
};