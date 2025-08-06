require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const specs = require('./config/swagger');
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

// Custom Swagger UI endpoint for Vercel compatibility
app.get('/api-docs', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewsHub API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar { display: none }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api-docs/swagger.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                showExtensions: true
            });
        };
    </script>
</body>
</html>`;
  res.send(html);
});

// Serve the OpenAPI spec as JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.json(specs);
});

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