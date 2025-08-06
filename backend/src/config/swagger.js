const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NewsHub API',
      version: '1.0.0',
      description: 'A comprehensive news aggregation and personalization API',
      contact: {
        name: 'NewsHub Team',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://newshub-backend.vercel.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Article: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique article identifier'
            },
            title: {
              type: 'string',
              description: 'Article title'
            },
            description: {
              type: 'string',
              description: 'Article description'
            },
            content: {
              type: 'string',
              description: 'Article content'
            },
            url: {
              type: 'string',
              description: 'Original article URL'
            },
            imageUrl: {
              type: 'string',
              description: 'Article image URL'
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Publication date'
            },
            source: {
              type: 'string',
              description: 'News source'
            },
            topic: {
              type: 'string',
              description: 'Article topic/category'
            },
            sentiment: {
              type: 'string',
              enum: ['positive', 'negative', 'neutral'],
              description: 'Article sentiment analysis'
            },
            score: {
              type: 'number',
              description: 'Relevance score'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            status: {
              type: 'number',
              description: 'HTTP status code'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Current page number'
            },
            limit: {
              type: 'number',
              description: 'Items per page'
            },
            total: {
              type: 'number',
              description: 'Total number of items'
            },
            totalPages: {
              type: 'number',
              description: 'Total number of pages'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'News',
        description: 'News articles and content operations'
      },
      {
        name: 'User',
        description: 'User preferences and history'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Metadata',
        description: 'Metadata and configuration'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'] // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs; 