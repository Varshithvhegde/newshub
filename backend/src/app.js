require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createSearchIndex } = require('./services/redisService');
const newsRoutes = require('./routes/newsRoutes');
const metadataRoutes = require('./routes/metadataRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

// Handle preflight requests
app.options('*', cors(corsOptions));

// Initialize search index on startup
createSearchIndex();

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app; 