import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/environment.js';
import { connectDatabase, disconnectDatabase, getDatabaseStatus } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { initSocketServer, getSocketServer, closeSocketServer } from './sockets/socketManager.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { syncKeycloakSmtpConfig } from './services/keycloakService.js';

// Initialize Express application
const app = express();

// ==============================================================================
// 1. SECURITY & HTTP HEADERS (HELMET)
// ==============================================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ==============================================================================
// 2. CORS CONFIGURATION
// ==============================================================================
// Strict origin whitelist matching CLIENT_URL (default http://localhost:5173).
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      config.clientUrl,
      !config.isProduction ? 'http://localhost:5173' : null,
      !config.isProduction ? 'http://127.0.0.1:5173' : null,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin "${origin}" not allowed by CORS policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));

// ==============================================================================
// 3. RATE LIMITING FOUNDATION
// ==============================================================================
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP address, please try again after 15 minutes.',
      },
    });
  },
});

app.use(globalRateLimiter);

// ==============================================================================
// 4. REQUEST BODY PARSING
// ==============================================================================
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Simple request logger for development visibility (no sensitive payloads logged)
if (!config.isTest) {
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// ==============================================================================
// 5. BASE ROUTES & HEALTH CHECKS
// ==============================================================================

// Root info route
app.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    success: true,
    name: 'Campus Classifieds API Server',
    status: 'running',
    phase: 'B11 - Reports System',
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
    },
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      listings: '/api/listings',
      messages: '/api/messages',
      reports: '/api/reports',
    },
  });
});

// Dedicated health endpoint reflecting genuine database connectivity
app.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus.isConnected;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'ok' : 'degraded',
    environment: config.env,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
    },
  });
});

// Base API route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Classifieds API is running',
    version: '1.0.0',
    environment: config.env,
  });
});

// Authentication Routes (Phase B3 & B4)
app.use('/api/auth', authRoutes);

// User & Profile Management Routes (Phase B5)
app.use('/api/users', userRoutes);

// Listings CRUD Routes (Phase B6 & B7 & B9)
app.use('/api/listings', listingRoutes);

// Real-Time Messaging Routes (Phase B10)
app.use('/api/messages', messageRoutes);

// Reports System Routes (Phase B11)
app.use('/api/reports', reportRoutes);

// ==============================================================================
// 6. ERROR HANDLING & 404 DISPATCHER
// ==============================================================================
// Catch-all handler for unmapped routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ==============================================================================
// 7. SERVER BOOTSTRAP & GRACEFUL SHUTDOWN
// ==============================================================================
let server;

/**
 * Start the application following the sequence:
 * Load Environment -> Connect PostgreSQL -> Start HTTP + Socket.IO Server
 */
const startServer = async () => {
  try {
    console.log('[STARTUP] Connecting to PostgreSQL database via Prisma...');
    await connectDatabase();

    // Synchronize Keycloak SMTP configuration from environment (Mailpit or Gmail SMTP)
    syncKeycloakSmtpConfig().catch((err) => {
      console.warn('[STARTUP] Background Keycloak SMTP sync notice:', err?.message || err);
    });

    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    server = httpServer.listen(config.port, () => {
      console.log('====================================================');
      console.log('  Campus Classifieds Backend Server (PostgreSQL)');
      console.log('====================================================');
      console.log(`  Environment : ${config.env}`);
      console.log(`  Port        : ${config.port}`);
      console.log(`  Local URL   : http://localhost:${config.port}`);
      console.log(`  CORS Origin : ${config.clientUrl}`);
      console.log(`  Health Check: http://localhost:${config.port}/health`);
      console.log(`  API Base    : http://localhost:${config.port}/api`);
      console.log(`  Socket.IO   : ws://localhost:${config.port}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('\n[FATAL STARTUP ERROR] Could not start server:');
    console.error(`  Reason: ${error.message}`);
    console.error('  Please check DATABASE_URL in server/.env and verify PostgreSQL reachability.\n');
    process.exit(1);
  }
};

// Start server if not executing inside a test runner
if (!config.isTest) {
  startServer();

  // Graceful shutdown handler
  const handleShutdown = async (signal) => {
    console.log(`\n[SHUTDOWN] Received ${signal}. Closing server gracefully...`);
    try {
      if (server) {
        await closeSocketServer();
        await new Promise((resolve) => server.close(resolve));
        console.log('[SHUTDOWN] HTTP and Socket.IO server closed cleanly.');
      }
      await disconnectDatabase();
      console.log('[SHUTDOWN] Process exiting cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[SHUTDOWN] Error during graceful shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

export { app, server, getSocketServer, initSocketServer, closeSocketServer };
export default app;
