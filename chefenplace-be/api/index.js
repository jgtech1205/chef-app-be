const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../database/connection');

// Import routes
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const panelRoutes = require('../routes/panelRoutes');
const recipeRoutes = require('../routes/recipeRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const adminRoutes = require('../routes/adminRoutes');
const chefRoutes = require('../routes/chefRoutes');
const restaurantRoutes = require('../routes/restaurantRoutes');
const plateUpRoutes = require('../routes/plateupRoutes');
const plateupFolderRoutes = require('../routes/plateupFolderRoutes');
const stripeRoutes = require('../routes/stripeRoutes');

const app = express();

// Connect to MongoDB (with error handling for serverless)
try {
  connectDB();
} catch (error) {
  console.error('Database connection error:', error.message);
}

// Security middleware
app.use(helmet());

// AGGRESSIVE CORS FIX - This will definitely work
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://chef-app-frontend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Additional CORS middleware as backup
app.use(cors({
  origin: 'https://chef-app-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// General middleware
app.use(compression());
app.use(morgan('combined'));

// Raw body middleware for Stripe webhooks
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON parsing middleware for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/panels', panelRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plateups', plateUpRoutes);
app.use('/api/plateup-folders', plateupFolderRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Chef en Place API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Additional health check for serverless environments
app.get('/api/health/detailed', async (req, res) => {
  try {
    // Check database connection
    const dbStatus =
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
      status: 'OK',
      message: 'Chef en Place API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Export for Vercel serverless function
module.exports = app;
