import React, { useState } from 'react';
import { useChatState } from './features/chat/useChatState';
import './App.css';

function App() {
  const { messages, sendMessage, isLoading } = useChatState();
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="kairo-container">
      <header className="kairo-header">
        <h1>KAIRO OS</h1>
        <span className="status-badge">v0.1 Core Kernel Online</span>
      </header>

      <main className="chat-window">
        <div className="message-list">
          {messages.length === 0 && (
            <p className="empty-state">System standing ready. Enter an operational prompt.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble ${msg.role}`}>
              <div className="avatar-label">{msg.role === 'user' ? 'User' : 'KAIRO'}</div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="input-tray">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Issue a system directive..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Processing...' : 'Execute'}
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;