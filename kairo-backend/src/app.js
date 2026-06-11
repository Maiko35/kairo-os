import express from 'express';
import cors from 'cors';
import threadRouter from './routes/thread.routes.js';
import { handleStreamMessage } from './features/chat/chat.controller.js';

const app = express();

// Enable access for our upcoming frontend application
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Mount Subsystem Network Gateways
app.use('/api/threads', threadRouter);

// System verification route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    system: 'KAIRO v0.1',
    timestamp: new Date().toISOString()
});
});

// AI Core Orchestration Routes
app.post('/api/v1/chat/stream', handleStreamMessage);

export default app;