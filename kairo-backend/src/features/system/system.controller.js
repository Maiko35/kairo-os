import { kernelConfig } from '../../kernel/registry/configRegistry.js';
import { threadDao } from '../../services/threadDao.service.js';
import { ollamaBroker } from '../../kernel/broker/ollamaBroker.js';

/**
 * Controller: Gathers dynamic telemetry metrics representing KAIRO's operational state.
 */
export const getRuntimeStatus = async (req, res) => {
  try {
    // 1. Fetch live health check ping from local Ollama service daemon
    const isOllamaOnline = await ollamaBroker.checkHealth();
    
    // 2. Aggregate thread metrics directly from database disk layers
    const totalThreads = threadDao.getThreadCount();
    
    // 3. Extract core kernel build identity data from our centralized registry
    const systemMeta = kernelConfig.getSystemMeta();
    const configMatrix = kernelConfig.getAllConfig();

    // 4. Synthesize your final architectural telemetry payload
    const telemetryData = {
      status: 'ONLINE',
      kernelVersion: systemMeta.kernelVersion,
      codename: systemMeta.codename,
      uptimeMs: systemMeta.currentUptime,
      activeModel: configMatrix.activeChatModel,
      activeCodingModel: configMatrix.activeCodingModel,
      activeAgent: configMatrix.activeAgentProfile,
      threadCount: totalThreads,
      subsystems: {
        databaseEngine: 'SQLite (Pragma Secure)',
        modelBroker: isOllamaOnline ? 'CONNECTED' : 'DISCONNECTED'
      },
      systemHealth: isOllamaOnline ? 'OPTIMAL' : 'DEGRADED'
    };

    return res.status(200).json(telemetryData);
  } catch (error) {
    console.error('[Telemetry Subsystem Error] Failed to compile runtime metrics:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Internal Kernel Telemetry Fault' });
  }
};