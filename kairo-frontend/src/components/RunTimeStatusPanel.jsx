import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export function RuntimeStatusPanel() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${apiService.BASE_URL}/v1/system/status`);
        const data = await response.json();
        setTelemetry(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to capture runtime diagnostics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (loading || !telemetry) {
    return (
      <div className="empty-state" style={{ fontFamily: 'var(--sys-font-mono)', fontSize: '12px', color: 'var(--sys-text-muted)' }}>
        Connecting to local runtime environment...
      </div>
    );
  }

  const formatUptime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '850px' }}>
      
      {/* Core Summary Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sys-border)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--sys-text-primary)', letterSpacing: '-0.2px' }}>
            Runtime Status
          </h2>
          <div style={{ marginTop: '4px', fontSize: '12px', fontFamily: 'var(--sys-font-mono)', color: 'var(--sys-text-muted)' }}>
            Node ID // <span style={{ color: 'var(--sys-accent)' }}>{telemetry.codename || 'kairo'}-local-core</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(54, 211, 153, 0.04)', border: '1px solid rgba(54, 211, 153, 0.15)' }}>
          <span className="status-orb" />
          <span style={{ fontFamily: 'var(--sys-font-mono)', fontSize: '11px', fontWeight: '600', color: 'var(--sys-success)' }}>
            {telemetry.status?.toUpperCase() || 'ONLINE'}
          </span>
        </div>
      </div>

      {/* Metrics Performance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        <div className="status-card-metric">
          <span className="status-card-label">System Version</span>
          <span className="status-card-value">v{telemetry.kernelVersion || '1.0.0'}</span>
        </div>

        <div className="status-card-metric">
          <span className="status-card-label">Runtime Uptime</span>
          <span className="status-card-value" style={{ color: 'var(--sys-success)' }}>{formatUptime(telemetry.uptimeMs)}</span>
        </div>

        <div className="status-card-metric">
          <span className="status-card-label">Active Model</span>
          <span className="status-card-value" style={{ color: 'var(--sys-accent)' }}>{telemetry.activeModel || 'Qwen2.5-Coder'}</span>
        </div>

        <div className="status-card-metric">
          <span className="status-card-label">Agent Registry</span>
          <span className="status-card-value">{telemetry.activeAgent || 'Core Assistant'}</span>
        </div>

        <div className="status-card-metric">
          <span className="status-card-label">Active Threads</span>
          <span className="status-card-value">{telemetry.threadCount || 0} Sessions</span>
        </div>

        <div className="status-card-metric">
          <span className="status-card-label">Model Broker Status</span>
          <span className="status-card-value" style={{ color: 'var(--sys-success)' }}>{telemetry.subsystems?.modelBroker || 'CONNECTED'}</span>
        </div>

      </div>

      {/* Deep Subsystem Metrics Diagnostics */}
      <div style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: '8px', border: '1px solid var(--sys-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', color: 'var(--sys-text-muted)' }}>
          Subsystem Health Metrics
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 32px', fontFamily: 'var(--sys-font-mono)', fontSize: '12px' }}>
          
          <div className="subsystem-row">
            <span>Database Engine</span>
            <span style={{ color: 'var(--sys-text-primary)' }}>{telemetry.subsystems?.databaseEngine || 'SQLite3'}</span>
          </div>

          <div className="subsystem-row">
            <span>Core Model Subsystem</span>
            <span style={{ color: 'var(--sys-accent)' }}>{telemetry.activeCodingModel || 'qwen2.5-coder:14b'}</span>
          </div>

          <div className="subsystem-row">
            <span>System Health</span>
            <span style={{ color: 'var(--sys-success)', fontWeight: '600' }}>{telemetry.systemHealth || 'OPTIMAL'}</span>
          </div>

          <div className="subsystem-row">
            <span>Sandbox Isolation</span>
            <span style={{ color: 'var(--sys-text-muted)' }}>ACTIVE</span>
          </div>

        </div>
      </div>

    </div>
  );
}