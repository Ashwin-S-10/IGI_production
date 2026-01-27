// CRITICAL: Load environment configuration FIRST - before any other imports
import { env, validateEnv } from './config/env';

// Validate environment
if (!validateEnv()) {
  console.error('❌ Environment validation failed. Server cannot start.');
  process.exit(1);
}
// Load environment variables FIRST
import './config/env';
import { checkEnvironment } from './config/env';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import contestRoutes from './routes/contest';
import missionRoutes from './routes/mission';
import uploadsRoutes from './routes/uploads';
import teamsRoutes from './routes/teams';

// Debug: Check critical environment variables
console.log('🔍 Environment Check:');
console.log('  - GEMINI_API_KEY:', env.GEMINI_API_KEY ? `Set (${env.GEMINI_API_KEY.substring(0, 10)}...)` : '❌ NOT SET');
console.log('  - PORT:', env.PORT);
console.log('  - FRONTEND_URL:', env.FRONTEND_URL);
console.log('  - NODE_ENV:', env.NODE_ENV);
console.log('  - NEXT_PUBLIC_SUPABASE_URL:', env.SUPABASE_URL ? `Set (${env.SUPABASE_URL})` : '❌ NOT SET');
console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.SUPABASE_ANON_KEY ? 'Set' : '❌ NOT SET');
console.log('  - SUPABASE_SERVICE_ROLE_KEY:', env.SUPABASE_SERVICE_KEY ? 'Set' : '❌ NOT SET');
// Check environment
checkEnvironment();

const app = express();
const PORT = parseInt(env.PORT, 10);
const FRONTEND_URL = env.FRONTEND_URL;

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'IGI Backend API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      contest: '/api/contest/*',
      mission: '/api/mission/*',
      uploads: '/api/uploads/*',
      teams: '/api/teams/*'
    }
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contest', contestRoutes);
app.use('/api/mission', missionRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/teams', teamsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${FRONTEND_URL}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
