class ConfigRegistry {
  constructor() {
    // Sealed platform core attributes
    this.systemMeta = {
      kernelVersion: '1.0.0-alpha',
      systemName: 'KAIRO OS',
      codename: 'MIDNIGHT',
      uptimeStart: Date.now()
    };

    // Dynamic configuration matrix variables
    this.registry = {
      activeChatModel: 'qwen2.5:7b',
      activeCodingModel: 'qwen2.5-coder:14b',
      activeAgentProfile: 'core_assistant',
      runtimeFlags: {
        streamDebug: false,
        performanceLogging: true,
        allowTelemetryBridge: true
      },
      featureFlags: {
        autoTitling: true,
        metricsPanel: true,
        slashDirectives: true,
        memoryEngine: false
      }
    };
  }

  getSystemMeta() {
    return { 
      ...this.systemMeta, 
      currentUptime: Date.now() - this.systemMeta.uptimeStart 
    };
  }

  get(key) {
    return this.registry[key];
  }

  set(key, value) {
    if (this.registry[key] !== undefined) {
      this.registry[key] = value;
      return true;
    }
    return false;
  }

  getAllConfig() {
    return { ...this.registry };
  }
}

export const kernelConfig = new ConfigRegistry();