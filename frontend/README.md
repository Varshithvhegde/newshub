# NewsHub - AI-Powered News Aggregation & Summarization Platform

A modern, responsive news aggregation and summarization platform built with React, TypeScript, and Tailwind CSS. This frontend application provides users with AI-powered news summaries, personalized feeds, and advanced search capabilities.

## 🚀 Features

### Core Functionality
- **AI-Powered News Summaries**: Get concise, intelligent summaries of news articles
- **Personalized News Feed**: Tailored content based on user preferences and reading history
- **Advanced Search**: Filter articles by topic, sentiment, source, and keywords
- **Real-time Updates**: Stay informed with the latest news from multiple sources
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### User Experience
- **Infinite Scroll**: Seamless browsing with automatic content loading
- **Article Analytics**: View engagement metrics and trending articles
- **Sentiment Analysis**: Visual indicators for article sentiment (positive, negative, neutral)
- **Topic Filtering**: Browse news by categories and interests
- **Dark/Light Mode**: Theme support for comfortable reading

### Technical Features
- **TypeScript**: Full type safety and better development experience
- **React Query**: Efficient data fetching and caching
- **React Router**: Client-side routing with smooth navigation
- **Tailwind CSS**: Utility-first styling with custom components
- **Shadcn/ui**: Beautiful, accessible UI components
- **Vite**: Fast development and build tooling

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
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

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or bun package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newshub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Create environment file (optional)**
   ```bash
   cp env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080` to view the application

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── ArticleCard.tsx # Article display component
│   ├── Header.tsx      # Navigation header
│   ├── LoadingSpinner.tsx
│   ├── SearchFilters.tsx
│   ├── SentimentBadge.tsx
│   └── ...
├── pages/              # Page components
│   ├── Home.tsx        # Main landing page
│   ├── Search.tsx      # Search and filtering
│   ├── Article.tsx     # Individual article view
│   ├── PersonalizedFeed.tsx
│   ├── Trending.tsx
│   └── NotFound.tsx
├── hooks/              # Custom React hooks
│   ├── useDebounce.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/                # Utility libraries
│   ├── api.ts          # API client and types
│   ├── userManager.ts  # User management
│   └── utils.ts        # Helper functions
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables
The application uses environment variables for configuration. Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=false
```

The API base URL is automatically configured with fallback to `http://localhost:3001` if not specified.

### API Endpoints
The frontend expects the following API endpoints from the backend:

- `GET /api/articles` - Get all articles with pagination
- `GET /api/articles/:id` - Get specific article
- `GET /api/articles/search` - Search articles
- `GET /api/topics` - Get available topics
- `GET /api/sentiments` - Get sentiment options
- `GET /api/sources` - Get news sources
- `GET /api/trending` - Get trending articles
- `POST /api/users/preferences` - Store user preferences
- `GET /api/users/:id/preferences` - Get user preferences
- `GET /api/users/:id/personalized` - Get personalized news

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

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload the dist folder to Netlify
```

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

- [ ] Offline reading capabilities
- [ ] Push notifications for breaking news
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Podcast integration
- [ ] Video news summaries

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
