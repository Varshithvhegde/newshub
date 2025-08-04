# NewsHub - AI-Powered News Aggregation Platform

A modern, full-stack news aggregation and summarization platform built with React, TypeScript, Node.js, and Redis. NewsHub provides users with AI-powered news summaries, personalized feeds, and advanced search capabilities using Google Gemini AI and Redis vector search.

## 🚀 Features

### Core Functionality
- **AI-Powered News Summarization**: Uses Google Gemini AI for intelligent content analysis
- **Vector Search & Similarity**: Redis-based semantic search with embeddings
- **Personalized News Feeds**: User preference-based content recommendations
- **Real-time News Fetching**: Automated news collection from multiple sources
- **Advanced Search**: Filter articles by topic, sentiment, source, and keywords
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### User Experience
- **Infinite Scroll**: Seamless browsing with automatic content loading
- **Article Analytics**: View engagement metrics and trending articles
- **Sentiment Analysis**: Visual indicators for article sentiment (positive, negative, neutral)
- **Topic Filtering**: Browse news by categories and interests
- **Real-time Updates**: Stay informed with the latest news from multiple sources

### Technical Features
- **TypeScript**: Full type safety and better development experience
- **React Query**: Efficient data fetching and caching
- **React Router**: Client-side routing with smooth navigation
- **Tailwind CSS**: Utility-first styling with custom components
- **Shadcn/ui**: Beautiful, accessible UI components
- **Redis 8+**: Advanced caching, vector search, and JSON storage
- **Express.js**: High-performance REST API
- **Vite**: Fast development and build tooling

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Notifications**: Sonner toast

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Redis 8+ (JSON, Vector Search, Caching)
- **AI Services**: Google Gemini AI (Gemini 2.0 Flash, Embeddings)
- **News API**: NewsAPI.org integration
- **Caching**: Multi-layer Redis caching system
- **Search**: Redis Search with vector similarity
- **Scheduling**: Node-cron for automated tasks

## 📁 Project Structure

```
newshub/
├── backend/                 # Node.js backend (NewsHub API)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   │   └── newsController.js
│   │   ├── routes/         # API route definitions
│   │   │   ├── adminRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   ├── metadataRoutes.js
│   │   │   ├── newsRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/       # Business logic
│   │   │   ├── cacheClearService.js
│   │   │   ├── geminiService.js
│   │   │   ├── newsFetcherService.js
│   │   │   ├── newsProcessor.js
│   │   │   └── redisService.js
│   │   ├── middleware/     # Express middleware
│   │   │   ├── errorHandler.js
│   │   │   └── logger.js
│   │   ├── utils/          # Utility functions
│   │   │   └── pagination.js
│   │   ├── config/         # Configuration
│   │   │   └── database.js
│   │   ├── scripts/        # Management scripts
│   │   │   ├── clearAllCache.js
│   │   │   ├── clearCache.js
│   │   │   ├── clearCacheExceptUser.js
│   │   │   ├── clearNews.js
│   │   │   └── deleteSearchIndex.js
│   │   └── app.js          # Express application
│   ├── scripts/            # Root-level scripts
│   │   └── run-news-processor.js
│   ├── docs/               # Documentation
│   │   ├── CACHE_CLEARING.md
│   │   ├── CACHE_MANAGEMENT.md
│   │   └── README.md
│   ├── logs/               # Application logs
│   ├── index.js            # Entry point
│   ├── addNews.js          # News addition utility
│   ├── test-cors.js        # CORS testing utility
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json         # Vercel deployment config
│   ├── cache_clear_metrics_1754132194592.json
│   └── README.md
├── frontend/               # React frontend (NewsHub Web App)
│   ├── .gitignore
│   ├── env.example         # Environment variables template
│   ├── index.html          # HTML template
│   ├── bun.lockb           # Bun lock file
│   ├── components.json     # Shadcn/ui configuration
│   ├── eslint.config.js    # ESLint configuration
│   └── node_modules/       # Dependencies
└── README.md               # This file
```

**Note**: The frontend directory is currently in a minimal state with configuration files. The main application structure is expected to include:
- `src/` directory with React components
- `public/` directory for static assets
- `package.json` for dependencies
- Build configuration files

## 📦 Installation

### Prerequisites
- Node.js 18+
- Redis 8+ (with RedisJSON and RedisSearch modules)
- Google Gemini API key
- NewsAPI.org API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd news_summarise
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   echo "REDIS_URL=redis://localhost:6379
   GEMINI_API_KEY=your_gemini_api_key
   NEWSAPI_KEY=your_newsapi_key
   PORT=3001
   NODE_ENV=development" > .env
   
   # Start the server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create environment file (optional - will use fallback if not created)
   cp env.example .env
   
   # Start development server
   npm run dev
   ```

4. **Access the Application**
   - **Frontend**: http://localhost:8080
   - **Backend API**: http://localhost:3001

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
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

#### Frontend Configuration
The frontend uses environment variables for configuration. Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=false
```

The API base URL is automatically configured with fallback to `http://localhost:3001` if not specified.

### Redis Requirements
- Redis 8+ with RedisJSON module
- RedisSearch module for vector search
- Minimum 1GB memory recommended

### CORS Configuration
The backend is configured to accept requests from:
- Local development: `http://localhost:8080`, `http://localhost:3000`, `http://localhost:5173`
- Production: `https://newshub-henna.vercel.app` and other Vercel domains
- Custom domains can be added to the CORS configuration in `src/app.js`

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

## 🚀 Available Scripts

### Backend
```bash
# Development
npm run dev              # Start development server
npm start                # Start production server

# Cache Management
npm run cache:stats      # Show cache statistics
npm run cache:clear      # Clear cache (with confirmation)
npm run cache:force      # Force clear cache
npm run cache:nuclear    # Clear all Redis data
npm run cache:complete-stats  # Detailed Redis statistics
npm run cache:help       # Show cache management help
```

### Frontend
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run build:dev        # Build for development
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

## 🎨 UI Components

The application uses a comprehensive set of UI components built with Shadcn/ui and Radix UI:

- **Cards**: Article display and information containers
- **Buttons**: Various button styles and states
- **Badges**: Topic and sentiment indicators
- **Forms**: Search filters and user preferences
- **Navigation**: Header and mobile menu
- **Loading States**: Spinners and skeleton loaders
- **Toasts**: Success and error notifications

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Collapsible navigation menu
- Touch-friendly interactions
- Optimized layouts for different screen sizes
- Progressive enhancement

## 🔍 Search & Filtering

Advanced search capabilities include:
- **Text Search**: Search by article title and content
- **Topic Filtering**: Filter by news categories
- **Sentiment Filtering**: Filter by article sentiment
- **Source Filtering**: Filter by news source
- **Date Range**: Filter by publication date
- **Combined Filters**: Use multiple filters simultaneously

## 👤 Personalization

User personalization features:
- **Topic Preferences**: Set preferred news topics
- **Personalized Feed**: AI-curated content based on preferences
- **Reading History**: Track viewed articles
- **Engagement Metrics**: View article popularity and trends

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

### Backend Deployment
```bash
# Local Development
npm run dev

# Production Deployment
npm start

# Vercel Deployment
vercel --prod
```

### Frontend Deployment
```bash
# Build for Production
npm run build

# Deploy to Vercel
npm install -g vercel
vercel

# Deploy to Netlify
npm run build
# Upload the dist folder to Netlify
```

## 📚 Documentation

- [Backend Documentation](backend/README.md)
- [Cache Management Guide](backend/docs/CACHE_MANAGEMENT.md)
- [Cache Clearing Guide](backend/docs/CACHE_CLEARING.md)
- [API Documentation](backend/docs/README.md)

## 👨‍💻 Author

**Varshith V Hegde** ([@Varshithvhegde](https://github.com/Varshithvhegde))

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🔮 Roadmap

- [ ] Real-time breaking news notifications
- [ ] Live analytics dashboard
- [ ] AI-powered chatbot
- [ ] Advanced content curation
- [ ] Offline reading capabilities
- [ ] Push notifications for breaking news
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Podcast integration
- [ ] Video news summaries

## 🏆 Redis AI Challenge

This project is designed for the **Redis AI Challenge** and demonstrates:

### Real-Time AI Innovators Features
- **AI-Powered Content Analysis**: Google Gemini AI integration
- **Vector Search**: Redis-based semantic similarity
- **Real-Time Processing**: Live news analysis and recommendations
- **Personalized AI**: ML-based content curation

### Beyond the Cache Features
- **Redis as Primary Database**: JSON storage with full-text search
- **Advanced Redis Features**: Vector search, streams, pub/sub
- **Performance Optimization**: Multi-layer caching strategies
- **Scalable Architecture**: Handle thousands of concurrent users

---

**Built with ❤️ using React, TypeScript, Node.js, Express, Redis, and Google Gemini AI** 