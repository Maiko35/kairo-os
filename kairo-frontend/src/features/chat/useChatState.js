import { useState } from 'react';
import { streamChatMessage } from '../../services/api';

export const useChatState = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // 1. Instantly append the user message to our history array
    const userMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 2. Setup a placeholder index for the incoming AI response block
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder = { id: assistantMessageId, role: 'assistant', content: '' };
    
    setMessages((prev) => [...prev, assistantPlaceholder]);

    // 3. Initiate the stream pipeline connection
    await streamChatMessage(
      text,
      (token) => {
        // Appends tokens step-by-step into the target message block
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      (error) => {
        console.error('Streaming client error:', error);
        setIsLoading(false);
      },
      () => {
        // Stream completed successfully
        setIsLoading(false);
      }
    );
  };

  return { messages, sendMessage, isLoading };
};