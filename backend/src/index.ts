import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import bankAccountRoutes from './routes/bankAccounts';
import reportRoutes from './routes/reports';
import publicRoutes from './routes/public';
import setupRoutes from './routes/setup';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Stricter rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
  skipSuccessfulRequests: true,
});

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://frontend-jtxe8pi4y-johns-projects-fb03b396.vercel.app',
    'https://frontend-3wvsi8lba-johns-projects-fb03b396.vercel.app',
    'https://frontend-lzehkxea3-johns-projects-fb03b396.vercel.app',
    'https://frontend-5vewgb7pf-johns-projects-fb03b396.vercel.app',
    'https://frontend-jhr95xytv-johns-projects-fb03b396.vercel.app',
    'https://frontend-ie3gjowun-johns-projects-fb03b396.vercel.app',
    'https://frontend-ohkf95n0h-johns-projects-fb03b396.vercel.app',
    'https://frontend-mmsnjrbkj-johns-projects-fb03b396.vercel.app',
    'https://frontend-pkty6xg1c-johns-projects-fb03b396.vercel.app',
    'https://frontend-3rcws6lg7-johns-projects-fb03b396.vercel.app',
    'https://frontend-flzlcgoqw-johns-projects-fb03b396.vercel.app',
    'https://frontend-p6dsj8he8-johns-projects-fb03b396.vercel.app',
    'https://homesbeforegrowth.org',
    'https://www.homesbeforegrowth.org'
  ],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'HBG Budget API',
    version: '1.0.0'
  });
});

// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// Setup routes (no authentication required)
app.use('/api/setup', setupRoutes);

// Authentication routes (with stricter rate limiting)
app.use('/api/auth', loginLimiter, authRoutes);

// Protected routes (require authentication)
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/bank-accounts', authenticateToken, bankAccountRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HBG Budget API server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 