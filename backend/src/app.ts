// /home/manal/projet_final_BPMS/backend/src/app.ts
import express from 'express';
import cors from 'cors';
import path from 'path';

// ✅ Import Routes 

import analyzeRoutes from './routes/analyze-candidate';
import authRoutes from './routes/auth.routes';
import jobOfferRoutes from './routes/jobOffer.routes';
import applicationRoutes from './routes/application.routes';
import candidateRoutes from './routes/candidate.routes';
import workflowRoutes from './routes/workflow.routes';

const app = express();

// ============================================================================
// Middleware Configuration
// ============================================================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================================
// Register Routes (الترتيب مهم!)
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/joboffers', jobOfferRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/analyze-candidate', analyzeRoutes);
app.use('/api/workflows', workflowRoutes);

// ============================================================================
// Health Check & Default Route
// ============================================================================
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NexFlow API is running 🚀',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// 404 Handler - Must be after all routes
// ============================================================================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Global Error Handler - Must be last
// ============================================================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global Error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File too large', 
      message: 'Maximum file size is 5MB' 
    });
  }
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;