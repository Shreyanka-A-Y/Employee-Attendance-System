const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

dotenv.config();

const app = express();

// Middleware
// CORS configuration - allow all origins in development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.FRONTEND_URL 
      ? [process.env.FRONTEND_URL] 
      : ['http://localhost:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (profile images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));

// Debug: Log all registered routes
console.log('Registered routes:');
console.log('  POST /api/users/profile/upload-image');

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  
  // Handle other errors
  if (err.message) {
    return res.status(err.status || 500).json({ message: err.message });
  }
  
  res.status(500).json({ message: 'Internal server error' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Check required environment variables
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. Using default (NOT SECURE FOR PRODUCTION)');
  process.env.JWT_SECRET = 'default_jwt_secret_change_in_production';
}

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/employee-attendance';
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
  })
  .then(() => {
    console.log('✓ Connected to MongoDB successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API URL: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
      console.log('=================================');
    });
  })
  .catch((error) => {
    console.error('✗ MongoDB connection error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Is MongoDB running?');
    console.error('   - Windows: Check Services (services.msc)');
    console.error('   - Mac/Linux: Run "sudo systemctl start mongod"');
    console.error('2. Is the connection string correct?');
    console.error('   - Check MONGODB_URI in .env file');
    console.error('3. For MongoDB Atlas: Check IP whitelist and credentials');
    console.error('\nRun "npm run check-setup" to diagnose the issue');
    process.exit(1);
  });

module.exports = app;

