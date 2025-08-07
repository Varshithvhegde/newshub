# NewsHub - AI-Powered News Aggregation Platform
<img width="1000" height="420" alt="NewsHub - AI-Powered News Aggregation Platform" src="https://github.com/user-attachments/assets/77ef82aa-ddfa-4376-a681-fe9623ff1782" />

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

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React Router  │    │ • Express.js    │    │ • NewsAPI.org   │
│ • React Query   │    │ • Redis Client  │    │ • Google Gemini │
│ • Shadcn/ui     │    │ • AI Services   │    │ • Redis Cloud   │
│ • Tailwind CSS  │    │ • Cache Layer   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Layer    │    │   Data Layer    │    │   AI Layer      │
│                 │    │                 │    │                 │
│ • User Interface│    │ • Redis JSON    │    │ • Content       │
│ • Personalization│   │ • Vector Search │    │   Analysis      │
│ • Search/Filter │    │ • Multi-layer   │    │ • Sentiment     │
│ • Responsive UI │    │   Caching       │    │   Analysis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ NewsAPI.org │───►│ News        │───►│ AI          │───►│ Redis       │
│             │    │ Processor   │    │ Processor   │    │ Storage     │
│ • Raw News  │    │ • Fetch     │    │ • Gemini    │    │ • JSON      │
│ • Metadata  │    │ • Parse     │    │ • Embeddings│    │ • Vectors   │
│ • Sources   │    │ • Validate  │    │ • Sentiment │    │ • Indexes   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Frontend    │◄───│ API Layer   │◄───│ Cache Layer │◄───│ Search      │
│             │    │             │    │             │    │ Engine      │
│ • React App │    │ • Express   │    │ • Multi-    │    │ • Vector    │
│ • Components│    │ • Routes    │    │   layer     │    │   Search    │
│ • State Mgmt│    │ • Controllers│   │ • LRU Cache │    │ • Full-text │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Component Architecture

#### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages Layer                                                   │
│  ├── Home.tsx (News Feed)                                     │
│  ├── Search.tsx (Advanced Search)                             │
│  ├── Trending.tsx (Trending Articles)                         │
│  ├── PersonalizedFeed.tsx (User Preferences)                  │
│  ├── Article.tsx (Article Details)                            │
│  └── NotFound.tsx (404 Page)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Components Layer                                              │
│  ├── UI Components (Shadcn/ui)                                │
│  │   ├── Cards, Buttons, Forms                                │
│  │   ├── Navigation, Modals                                   │
│  │   └── Charts, Notifications                                │
│  ├── Custom Components                                         │
│  │   ├── ArticleCard.tsx                                      │
│  │   ├── SearchFilters.tsx                                    │
│  │   ├── Header.tsx                                           │
│  │   └── SentimentBadge.tsx                                   │
│  └── Layout Components                                         │
├─────────────────────────────────────────────────────────────────┤
│  Hooks Layer                                                   │
│  ├── useDebounce.ts (Search Optimization)                     │
│  ├── use-mobile.tsx (Responsive Logic)                        │
│  └── use-toast.ts (Notifications)                             │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                │
│  ├── api.ts (API Client)                                      │
│  ├── userManager.ts (User Management)                         │
│  ├── config.ts (Configuration)                                │
│  └── utils.ts (Utilities)                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Backend Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Express.js)                                        │
│  ├── Routes                                                    │
│  │   ├── /api/news (News Management)                          │
│  │   ├── /api/user (User Management)                          │
│  │   ├── /api/metadata (Metadata)                             │
│  │   ├── /api/admin (Admin Functions)                         │
│  │   └── /api/health (Health Checks)                          │
│  ├── Controllers                                               │
│  │   └── newsController.js (Request Handlers)                 │
│  └── Middleware                                                │
│      ├── errorHandler.js (Error Handling)                     │
│      └── logger.js (Logging)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                │
│  ├── redisService.js (Database Operations)                    │
│  ├── geminiService.js (AI Integration)                        │
│  ├── newsProcessor.js (Content Processing)                    │
│  ├── newsFetcherService.js (External API)                     │
│  └── cacheClearService.js (Cache Management)                  │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer (Redis)                                            │
│  ├── JSON Storage (Article Data)                              │
│  ├── Vector Search (Semantic Similarity)                      │
│  ├── Hash Storage (User Preferences)                          │
│  ├── Sorted Sets (Trending Metrics)                           │
│  └── Multi-layer Caching                                      │
└─────────────────────────────────────────────────────────────────┘
```

### AI Integration Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   AI Processing │    │   Vector        │
│   Input         │───►│   Pipeline      │───►│   Storage       │
│                 │    │                 │    │                 │
│ • News Articles │    │ • Gemini 2.0    │    │ • Embeddings    │
│ • Raw Text      │    │ • Summarization │    │ • Similarity    │
│ • Metadata      │    │ • Sentiment     │    │ • Search Index  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   AI Services   │    │   Search        │
│   Analysis      │    │                 │    │   Results       │
│                 │    │ • Text Analysis │    │                 │
│ • Keywords      │    │ • Entity        │    │ • Semantic      │
│ • Topics        │    │   Extraction    │    │   Search        │
│ • Categories    │    │ • Classification│    │ • Recommendations│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Caching Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Request       │    │   Cache Layer   │    │   Data Source   │
│   Layer         │───►│                 │───►│                 │
│                 │    │                 │    │                 │
│ • API Requests  │    │ • Request Cache │    │ • Redis JSON    │
│ • User Queries  │    │ • Query Cache   │    │ • Vector DB     │
│ • Search Filters│    │ • Result Cache  │    │ • External APIs │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └──────────────│   Cache         │◄─────────────┘
                        │   Statistics    │
                        │                 │
                        │ • Hit/Miss      │
                        │ • Performance   │
                        │ • Eviction      │
                        └─────────────────┘
```

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
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # Shadcn/ui components
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── PersonalizedSearchFilters.tsx
│   │   │   ├── PreferenceSetup.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── SentimentBadge.tsx
│   │   ├── pages/          # Page components
│   │   │   ├── Article.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Index.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── PersonalizedFeed.tsx
│   │   │   ├── Search.tsx
│   │   │   └── Trending.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/            # Utility libraries
│   │   │   ├── api.ts
│   │   │   ├── config.ts
│   │   │   ├── env.ts
│   │   │   ├── userManager.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx         # Main React component
│   │   ├── main.tsx        # Application entry point
│   │   ├── index.css       # Global styles
│   │   └── App.css         # App-specific styles
│   ├── public/             # Static assets
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── .gitignore
│   ├── bun.lockb           # Bun lock file
│   ├── components.json     # Shadcn/ui configuration
│   ├── env.example         # Environment variables template
│   ├── eslint.config.js    # ESLint configuration
│   ├── index.html          # HTML template
│   ├── package.json        # Dependencies and scripts
│   ├── package-lock.json
│   ├── postcss.config.js   # PostCSS configuration
│   ├── tailwind.config.ts  # Tailwind configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vercel.json         # Vercel deployment config
│   ├── vite.config.ts      # Vite configuration
│   └── vite.config.ts.timestamp-1753710958480-1ca4a5f8d9d6c.mjs
└── README.md               # This file
```

**Note**: The frontend is now fully developed with a complete React TypeScript application including:
- Comprehensive UI components with Shadcn/ui
- Multiple pages for different features (Home, Search, Trending, Personalized Feed, etc.)
- Custom hooks for functionality like debouncing and mobile detection
- API integration and user management
- Responsive design with Tailwind CSS

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
   cd newshub
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
- [Frontend Documentation](frontend/README.md)
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
