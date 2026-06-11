import app from './app.js';
import { config } from './config/env.js';
import { ollamaService } from './services/ollama.service.js';

async function bootstrap() {
  console.log('Initializing KAIRO Core Kernel...');

  try {
    // 1. Verify health of the local AI model infrastructure first
    const isOllamaHealthy = await ollamaService.checkHealth();
    
    if (isOllamaHealthy) {
      console.log('Local Model Broker established clean link to Ollama.');
    } else {
      console.log('Warning: Local Ollama runner not detected. Ensure Ollama is running.');
    }

    // 2. Bind network ports ONCE after health checks complete
    const server = app.listen(config.port, () => {
      console.log(`KAIRO Operating System Kernel online at: http://localhost:${config.port}`);
    });

    // 3. Catch generic socket or runtime exceptions cleanly
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Execution error: Port ${config.port} is already in use by another process.`);
      } else {
        console.error('Network socket error:', error.message);
      }
      process.exit(1);
    });

  } catch (initError) {
    console.error('Fatal initialization error during kernel boot:', initError.message);
    process.exit(1);
  }
}

// Execute the bootstrap sequence exactly once
bootstrap();