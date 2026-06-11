import React, { useState, useEffect, useRef } from 'react';
import { apiService } from './services/api';
import ReactMarkdown from 'react-markdown'; // <-- Imported Markdown parsing engine
import './App.css'; 

export default function App() {
  // System State Management
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [inputDirective, setInputDirective] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingTokenBuffer, setStreamingTokenBuffer] = useState('');
  
  const logsEndRef = useRef(null);

  // Bootstrap Load: Sync with the Thread Registry on launch
  useEffect(() => {
    loadRegistryInventory();
  }, []);

  // Auto-scroll workspace panel to follow incoming tokens smoothly
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, streamingTokenBuffer]);

  const loadRegistryInventory = async () => {
    try {
      const data = await apiService.fetchThreads();
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        handleSelectThread(data[0].id);
      }
    } catch (err) {
      console.error('Failed to sync with Thread Registry:', err);
    }
  };

  const handleSelectThread = async (id) => {
    setActiveThreadId(id);
    setStreamingTokenBuffer('');
    try {
      const historicalLogs = await apiService.fetchThreadLogs(id);
      setLogs(historicalLogs);
    } catch (err) {
      console.error('Failed to extract thread historical state:', err);
    }
  };

  const handleInitializeNewThread = async () => {
    try {
      const newThread = await apiService.createThread();
      await loadRegistryInventory();
      handleSelectThread(newThread.id);
    } catch (err) {
      console.error('Failed to initialize new thread container:', err);
    }
  };

  const handlePurgeThread = async (e, id) => {
    e.stopPropagation(); 
    try {
      await apiService.deleteThread(id);
      const updated = threads.filter(t => t.id !== id);
      setThreads(updated);
      if (activeThreadId === id) {
        setActiveThreadId(updated[0]?.id || null);
        setLogs(updated[0] ? await apiService.fetchThreadLogs(updated[0].id) : []);
      }
    } catch (err) {
      console.error('Resource deallocation fault during purge:', err);
    }
  };

  const handleDispatchDirective = async (e) => {
    e.preventDefault();
    if (!inputDirective.trim() || isStreaming || !activeThreadId) return;

    const userPayload = inputDirective;
    setInputDirective('');
    setIsStreaming(true);
    setStreamingTokenBuffer('');

    // Optimistically push the user directive into logs view
    setLogs(prev => [...prev, { role: 'user', content: userPayload }]);

    try {
      const response = await fetch('http://localhost:5050/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userPayload, threadId: activeThreadId })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completeAccumulatedOutput = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value);
        
        // UPGRADED parsing engine: Extract data payload blocks globally from text chunks
        const dataMatches = rawChunk.matchAll(/data:\s*(.+)/g);

        for (const match of dataMatches) {
          const dataStr = match[1].trim();
          
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              completeAccumulatedOutput += parsed.token;
              setStreamingTokenBuffer(completeAccumulatedOutput);
            }
          } catch (pErr) {
            // Skips incomplete JSON fragment lines safely
          }
        }
      }

      // Commit full chunk stream block to memory log array
      setLogs(prev => [...prev, { role: 'assistant', content: completeAccumulatedOutput }]);
      setStreamingTokenBuffer('');
      setIsStreaming(false);

    } catch (err) {
      console.error('[Console Processing Error] Stream fractured:', err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="layout-root">
      {/* 1. Thread Registry Sidebar */}
      <aside className="sidebar-container">
        <div className="sidebar-header">
          <div className="system-title-block">
            <span className="status-orb"></span>
            <h1>KAIRO OS</h1>
          </div>
          <button className="btn-init-thread" onClick={handleInitializeNewThread}>
            + New Thread
          </button>
        </div>

        <nav className="thread-nav-list">
          <div className="section-label">ACTIVE THREAD REGISTRY</div>
          {threads.map(thread => (
            <div 
              key={thread.id} 
              className={`thread-nav-item ${activeThreadId === thread.id ? 'active' : ''}`}
              onClick={() => handleSelectThread(thread.id)}
            >
              <div className="thread-meta-group">
                <span className="thread-title">{thread.title}</span>
                <span className="thread-firmware">{thread.agent_firmware}</span>
              </div>
              <button className="btn-purge" onClick={(e) => handlePurgeThread(e, thread.id)}>
                ✕
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. Main Workspace Display */}
      <main className="workspace-container">
        <header className="workspace-header">
          <div className="active-header-meta">
            <br />
            <h2>SYSTEM LOGS</h2>
            <span className="address-hash">{activeThreadId ? `THREAD_ADDR // ${activeThreadId}` : 'NO_ACTIVE_THREAD'}</span>
          </div>
        </header>

        <section className="stream-terminal-surface">
          {logs.map((log, index) => (
            <div key={index} className={`log-row-block role-${log.role}`}>
              <div className="row-metadata">
                {/*{log.role.toUpperCase()}*/}
                <span className="meta-label">{log.role === 'user' ? 'ROOT // ASIIMWE' : 'KAIRO // KERNEL'}</span>
                <span className="meta-timestamp">SECURE_CHANNEL</span>
              </div>
              <div className="row-body-content">
                {/* UPGRADED: Standard tags are now translated through the ReactMarkdown engine */}
                <ReactMarkdown>{log.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Real-time incoming token processing indicator */}
          {streamingTokenBuffer && (
            <div className="log-row-block role-assistant streaming">
              <div className="row-metadata">
                <span className="meta-label text-success">KERNEL STREAMING</span>
              </div>
              <div className="row-body-content">
                <ReactMarkdown>{streamingTokenBuffer}</ReactMarkdown>
              </div>
            </div>
          )}
          <div ref={logsEndRef} />
        </section>

        {/* 3. Input Directive Console */}
        <footer className="console-tray-footer">
          <form onSubmit={handleDispatchDirective} className="directive-form-wrapper">
            <input 
              type="text" 
              className="console-input"
              value={inputDirective}
              onChange={(e) => setInputDirective(e.target.value)}
              placeholder={activeThreadId ? "Issue system directive to kernel..." : "Initialize a system thread environment to begin..."}
              disabled={!activeThreadId || isStreaming}
            />
            <button 
              type="submit" 
              className="btn-dispatch"
              disabled={!activeThreadId || isStreaming || !inputDirective.trim()}
            >
              {isStreaming ? 'PROCESSING...' : 'DISPATCH'}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}