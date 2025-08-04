# NewsHub Backend - News Aggregation & AI Summarization API

A high-performance Node.js backend API for news aggregation, AI-powered summarization, and personalized content delivery. Built with Express.js, Redis, and Google Gemini AI.

## 🚀 Features

### Core Functionality
- **AI-Powered News Summarization**: Uses Google Gemini AI for intelligent content analysis
- **Vector Search & Similarity**: Redis-based semantic search with embeddings
- **Personalized News Feeds**: User preference-based content recommendations
- **Real-time News Fetching**: Automated news collection from multiple sources
- **Advanced Caching**: Multi-layer Redis caching with intelligent eviction
- **Comprehensive Analytics**: Article engagement metrics and trending analysis

### Technical Features
- **RESTful API**: Well-structured endpoints with proper HTTP methods
- **Pagination Support**: Efficient data pagination with metadata
- **Error Handling**: Robust error management with detailed logging
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Monitoring**: Built-in health checks and monitoring
- **Cache Management**: Advanced cache control and statistics

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: Redis 8+ (JSON, Vector Search, Caching)
- **AI Services**: Google Gemini AI (Gemini 2.0 Flash, Embeddings)
- **News API**: NewsAPI.org integration
- **Caching**: Multi-layer Redis caching system
- **Search**: Redis Search with vector similarity
- **Scheduling**: Node-cron for automated tasks

## 📦 Installation

### Prerequisites
- Node.js 18+
- Redis 8+ (with RedisJSON and RedisSearch modules)
- Google Gemini API key
- NewsAPI.org API key

### Setup Instructions

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file:
   ```env
   REDIS_URL=redis://localhost:6379
   GEMINI_API_KEY=your_gemini_api_key
   NEWSAPI_KEY=your_newsapi_key
   PORT=3001
   NODE_ENV=development
   ```

3. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   └── newsController.js
│   ├── routes/              # API route definitions
│   │   ├── newsRoutes.js    # News endpoints
│   │   ├── userRoutes.js    # User management
│   │   ├── metadataRoutes.js # Metadata endpoints
│   │   ├── adminRoutes.js   # Admin functions
│   │   └── healthRoutes.js  # Health checks
│   ├── services/            # Business logic
│   │   ├── redisService.js  # Redis operations
│   │   ├── geminiService.js # AI integration
│   │   └── newsFetcherService.js # News fetching
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js  # Error handling
│   │   └── logger.js        # Request logging
│   ├── utils/              # Utility functions
│   │   └── pagination.js   # Pagination helpers
│   ├── config/             # Configuration
│   │   └── database.js     # Database config
│   ├── scripts/            # Management scripts
│   │   ├── clearCache.js   # Cache management
│   │   ├── clearAllCache.js
│   │   ├── clearNews.js    # News data management
│   │   └── deleteSearchIndex.js
│   └── app.js              # Express application
├── docs/                   # Documentation
│   ├── README.md
│   └── CACHE_MANAGEMENT.md
├── logs/                   # Application logs
├── index.js                # Entry point
├── package.json
├── vercel.json            # Vercel deployment config
└── .env                   # Environment variables
```

## 🔌 API Endpoints

### News Management
- `GET /api/news` - Get all articles with pagination
- `GET /api/news/:id` - Get specific article by ID
- `GET /api/news/:id/similar` - Get similar articles
- `GET /api/news/:id/metrics` - Get article engagement metrics
- `GET /api/news/search` - Search articles with filters
- `GET /api/news/topic/:topic` - Get articles by topic
- `GET /api/news/sentiment/:sentiment` - Get articles by sentiment
- `GET /api/news/trending` - Get trending articles

### User Management
- `POST /api/user/generate-id` - Generate unique user ID
- `POST /api/user/:userId/preferences` - Store user preferences
- `GET /api/user/:userId/preferences` - Get user preferences
- `PUT /api/user/:userId/preferences` - Update user preferences
- `GET /api/user/:userId/personalized-news` - Get personalized feed
- `GET /api/user/:userId/personalized-news/search` - Search personalized content
- `GET /api/user/:userId/history` - Get user reading history

### Metadata & Analytics
- `GET /api/metadata/topics` - Get available topics
- `GET /api/metadata/sentiments` - Get sentiment options
- `GET /api/metadata/sources` - Get news sources

### Admin & Health
- `GET /api/admin/similar-stats/:id` - Get similarity statistics
- `GET /api/admin/clear-similar-cache/:id` - Clear similarity cache
- `GET /api/health` - Health check endpoint

## 🗄️ Redis Features

### Data Storage
- **JSON Storage**: Article data with full-text search
- **Vector Search**: Semantic similarity with embeddings
- **Hash Storage**: User preferences and metadata
- **Sorted Sets**: Trending articles and metrics

### Caching Strategy
- **Multi-layer Caching**: Request, query, and result caching
- **LRU Eviction**: Intelligent cache management
- **Bloom Filters**: Efficient duplicate detection
- **Cache Statistics**: Performance monitoring

### Search Capabilities
- **Full-text Search**: Article content and metadata
- **Vector Similarity**: Semantic article matching
- **Faceted Search**: Topic, sentiment, source filtering
- **Fuzzy Matching**: Typo-tolerant search

## 🚀 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm start` - Start production server

### Cache Management
- `npm run cache:stats` - Show cache statistics
- `npm run cache:clear` - Clear cache (with confirmation)
- `npm run cache:force` - Force clear cache
- `npm run cache:nuclear` - Clear all Redis data
- `npm run cache:complete-stats` - Detailed Redis statistics
- `npm run cache:help` - Show cache management help

## 🔧 Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# News API
NEWSAPI_KEY=your_newsapi_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Redis Requirements
- Redis 8+ with RedisJSON module
- RedisSearch module for vector search
- Minimum 1GB memory recommended

## 📊 AI Integration

### Gemini AI Services
- **Content Summarization**: Intelligent article summarization
- **Sentiment Analysis**: Positive, negative, neutral classification
- **Keyword Extraction**: Relevant topic and entity extraction
- **Vector Embeddings**: Semantic similarity generation

### News Processing Pipeline
1. **Fetch**: Collect news from multiple sources
2. **Analyze**: AI-powered content analysis
3. **Store**: Redis storage with search indexing
4. **Cache**: Multi-layer caching for performance
5. **Serve**: RESTful API delivery

## 🔍 Search & Filtering

### Search Parameters
- **Text Search**: Article title and content
- **Topic Filtering**: News categories and subjects
- **Sentiment Filtering**: Positive, negative, neutral
- **Source Filtering**: News source selection
- **Date Range**: Publication date filtering
- **Pagination**: Page and limit parameters

### Advanced Features
- **Vector Similarity**: Semantic article matching
- **Personalized Search**: User preference-based results
- **Trending Detection**: Popular article identification
- **Engagement Metrics**: View and interaction tracking

## 📈 Monitoring & Analytics

### Performance Metrics
- Request/response logging
- Cache hit/miss ratios
- API response times
- Memory usage monitoring
- Error tracking and reporting

### Health Checks
- Redis connectivity
- API endpoint availability
- Service status monitoring
- Performance benchmarks

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm start
```

### Vercel Deployment
The project includes `vercel.json` for easy Vercel deployment:
```bash
vercel --prod
```

## 📚 Documentation

- [Cache Management Guide](docs/CACHE_MANAGEMENT.md)
- [API Documentation](docs/README.md)
- [Redis Configuration](docs/REDIS_SETUP.md)

## 👨‍💻 Author

**Varshith V Hegde** ([@Varshithvhegde](https://github.com/Varshithvhegde))

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License

---

**Built with ❤️ using Node.js, Express, Redis, and Google Gemini AI** 