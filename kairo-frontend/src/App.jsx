import React, { useState, useEffect, useRef } from 'react';
import { apiService } from './services/api';
import { RuntimeStatusPanel } from './components/RunTimeStatusPanel';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import './App.css'; 

export default function App() {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [inputDirective, setInputDirective] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingTokenBuffer, setStreamingTokenBuffer] = useState('');
  const [activeTab, setActiveTab] = useState('console');
  
  const logsEndRef = useRef(null);

  useEffect(() => {
    loadThreadRegistry();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, streamingTokenBuffer]);

  const loadThreadRegistry = async () => {
    try {
      const data = await apiService.fetchThreads();
      
      // Defensively parse array whether the backend returns a raw array or an envelope object
      let historicalThreads = [];
      if (Array.isArray(data)) {
        historicalThreads = data;
      } else if (data && Array.isArray(data.threads)) {
        historicalThreads = data.threads;
      } else if (data && typeof data === 'object') {
        // Fallback for cases where data is an envelope containing array metrics under other keys
        const potentialArray = Object.values(data).find(val => Array.isArray(val));
        if (potentialArray) historicalThreads = potentialArray;
      }
        
      setThreads(historicalThreads);
      
      // Auto-select first thread if nothing is active
      if (historicalThreads.length > 0 && !activeThreadId) {
        const primaryId = historicalThreads[0].id;
        if (primaryId) handleSelectThread(primaryId);
      }
    } catch (err) {
      console.error('Failed to sync with Thread Registry:', err);
      setThreads([]);
    }
  };

  const handleSelectThread = async (id) => {
    if (!id) return;
    setActiveThreadId(id);
    setStreamingTokenBuffer('');
    try {
      const historicalLogs = await apiService.fetchThreadLogs(id);
      
      // Safeguard historical message payload array allocation
      let verifiedLogsArray = [];
      if (Array.isArray(historicalLogs)) {
        verifiedLogsArray = historicalLogs;
      } else if (historicalLogs && Array.isArray(historicalLogs.logs)) {
        verifiedLogsArray = historicalLogs.logs;
      } else if (historicalLogs && typeof historicalLogs === 'object') {
        const potentialArray = Object.values(historicalLogs).find(val => Array.isArray(val));
        if (potentialArray) verifiedLogsArray = potentialArray;
      }

      setLogs(verifiedLogsArray);
    } catch (err) {
      console.error('Failed to retrieve session history:', err);
      setLogs([]);
    }
  };

  const handleInitializeNewThread = async () => {
    try {
      const responseData = await apiService.createThread();
      await loadThreadRegistry();
      
      // Unpack response defensively to extract the new ID
      const targetId = responseData?.id || responseData?.data?.id || responseData?.thread?.id;
      
      if (targetId) {
        handleSelectThread(targetId);
      } else {
        // If the backend doesn't return the ID explicitly, sync from the top of the reloaded registry
        const syncData = await apiService.fetchThreads();
        const threadsList = Array.isArray(syncData) ? syncData : (syncData?.threads || []);
        if (threadsList.length > 0) {
          handleSelectThread(threadsList[0].id);
        }
      }
      setActiveTab('console');
    } catch (err) {
      console.error('Failed to initialize session thread:', err);
    }
  };

  const handlePurgeThread = async (e, id) => {
    e.stopPropagation(); 
    if (!id) return;
    try {
      await apiService.deleteThread(id);
      const currentThreads = Array.isArray(threads) ? threads : [];
      const updated = currentThreads.filter(t => t.id !== id);
      setThreads(updated);
      
      if (activeThreadId === id) {
        const nextThread = updated[0];
        if (nextThread && nextThread.id) {
          handleSelectThread(nextThread.id);
        } else {
          setActiveThreadId(null);
          setLogs([]);
        }
      }
    } catch (err) {
      console.error('Error during session thread removal:', err);
    }
  };

  const handleDispatchDirective = async (e) => {
    e.preventDefault();
    if (!inputDirective.trim() || isStreaming || !activeThreadId) return;

    const userPayload = inputDirective;
    setInputDirective('');
    setIsStreaming(true);
    setStreamingTokenBuffer('');

    setLogs(prev => {
      const activeLogs = Array.isArray(prev) ? prev : [];
      return [...activeLogs, { role: 'user', content: userPayload }];
    });

    try {
      const response = await fetch(`${apiService.BASE_URL}/v1/chat/stream`, {
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
        const dataMatches = rawChunk.matchAll(/data:\s*(.+)/g);

        for (const match of dataMatches) {
          const dataStr = match[1].trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              completeAccumulatedOutput += parsed.token;
              setStreamingTokenBuffer(completeAccumulatedOutput);
            }
          } catch (pErr) {}
        }
      }

      setLogs(prev => {
        const activeLogs = Array.isArray(prev) ? prev : [];
        return [...activeLogs, { role: 'assistant', content: completeAccumulatedOutput }];
      });
      setStreamingTokenBuffer('');
      setIsStreaming(false);

    } catch (err) {
      console.error('Stream interface anomaly:', err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="layout-root">
      {/* Thread Registry Sidebar */}
      <aside className="sidebar-container">
        <div className="sidebar-header">
          <div className="system-title-block">
            <span className="status-orb"></span>
            <h1>KAIRO</h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px', marginTop: '8px' }}>
            <button 
              onClick={() => setActiveTab('console')}
              className="btn-init-thread"
              style={{ border: 'none', padding: '6px 0', fontSize: '11px', fontFamily: 'var(--sys-font-mono)', borderRadius: '4px', backgroundColor: activeTab === 'console' ? 'var(--sys-bg)' : 'transparent', color: activeTab === 'console' ? 'var(--sys-accent)' : 'var(--sys-text-muted)' }}
            >
              WORKSPACE
            </button>
            <button 
              onClick={() => setActiveTab('metrics')}
              className="btn-init-thread"
              style={{ border: 'none', padding: '6px 0', fontSize: '11px', fontFamily: 'var(--sys-font-mono)', borderRadius: '4px', backgroundColor: activeTab === 'metrics' ? 'var(--sys-bg)' : 'transparent', color: activeTab === 'metrics' ? 'var(--sys-success)' : 'var(--sys-text-muted)' }}
            >
              METRICS
            </button>
          </div>

          <button className="btn-init-thread" style={{ marginTop: '8px' }} onClick={handleInitializeNewThread}>
            + New Thread
          </button>
        </div>

        <nav className="thread-nav-list">
          <div className="section-label">Thread Registry</div>
          {Array.isArray(threads) && threads.map(thread => (
            <div 
              key={thread.id || Math.random().toString()} 
              className={`thread-nav-item ${activeThreadId === thread.id && activeTab === 'console' ? 'active' : ''}`}
              onClick={() => {
                if (thread.id) {
                  handleSelectThread(thread.id);
                  setActiveTab('console');
                }
              }}
            >
              <div className="thread-meta-group">
                <span className="thread-title">{thread.title || 'Untitled Session'}</span>
                {/* Dynamically reads direct column string mapped to SQLite schema */}
                <span className="thread-firmware">{thread.agent_firmware || 'Core Assistant'}</span>
              </div>
              <button className="btn-purge" onClick={(e) => handlePurgeThread(e, thread.id)}>✕</button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Workspace Frame */}
      <main className="workspace-container">
        <header className="workspace-header">
          <div className="active-header-meta">
            <h2>{activeTab === 'metrics' ? 'Runtime Metrics' : 'Activity Feed'}</h2>
            <span className="address-hash">
              {activeThreadId ? `Session ID: ${activeThreadId}` : 'No Active Session'}
            </span>
          </div>
        </header>

        {activeTab === 'metrics' ? (
          <section className="stream-terminal-surface">
            <RuntimeStatusPanel />
          </section>
        ) : (
          <>
            <section className="stream-terminal-surface">
              {Array.isArray(logs) && logs.map((log, index) => (
                <div key={index} className={`log-row-block role-${log.role}`}>
                  <div className="row-metadata">
                    <span className="meta-label">{log.role === 'user' ? 'User' : 'KAIRO'}</span>
                    <span className="meta-timestamp">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                  <div className="row-body-content">
                    <MarkdownRenderer>{log.content}</MarkdownRenderer>
                  </div>
                </div>
              ))}

              {streamingTokenBuffer && (
                <div className="log-row-block role-assistant streaming">
                  <div className="row-metadata">
                    <span className="meta-label text-success">Streaming</span>
                  </div>
                  <div className="row-body-content">
                    <MarkdownRenderer>{streamingTokenBuffer}</MarkdownRenderer>
                  </div>
                </div>
              )}
              <div ref={logsEndRef} />
            </section>

            <footer className="console-tray-footer">
              <form onSubmit={handleDispatchDirective} className="directive-form-wrapper">
                <input 
                  type="text" 
                  className="console-input"
                  value={inputDirective}
                  onChange={(e) => setInputDirective(e.target.value)}
                  placeholder={activeThreadId ? "Ask KAIRO anything..." : "Initialize a thread to begin..."}
                  disabled={!activeThreadId || isStreaming}
                />
                <button 
                  type="submit" 
                  className="btn-dispatch"
                  disabled={!activeThreadId || isStreaming || !inputDirective.trim()}
                >
                  {isStreaming ? 'Thinking...' : 'Send'}
                </button>
              </form>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}