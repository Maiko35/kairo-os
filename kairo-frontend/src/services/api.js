const BACKEND_URL = 'http://localhost:5050/api/v1';

/**
 * Initiates an open connection to our streaming server-sent events endpoint
 * @param {string} userMessage - The raw prompt text entered by the user
 * @param {Function} onToken - Callback fired every time a new text token arrives
 * @param {Function} onError - Callback to handle pipeline failures
 * @param {Function} onComplete - Callback triggered when the stream outputs [DONE]
 */
export const streamChatMessage = async (userMessage, onToken, onError, onComplete) => {
  try {
    const response = await fetch(`${BACKEND_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`Server returned error code: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isStreaming = true;

    while (isStreaming) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const rawData = line.replace('data: ', '').trim();
        
        if (rawData === '[DONE]') {
          isStreaming = false;
          onComplete();
          break;
        }

        try {
          const parsed = JSON.parse(rawData);
          if (parsed.token) {
            onToken(parsed.token);
          }
        } catch (e) {
          // Ignore parsing anomalies over chunk lines
        }
      }
    }
  } catch (error) {
    onError(error.message);
  }
};