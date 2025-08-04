# News Summarizer with AI

A real-time news summarization application that fetches news from NewsAPI, summarizes articles using Google Gemini AI, and displays them in a beautiful React frontend.

## 🚀 Features

- **Real-time News Fetching** - Automatically fetches latest news every 10 minutes
- **AI-Powered Summarization** - Uses Google Gemini 2.0 Flash for intelligent article summaries
- **Sentiment Analysis** - Automatically analyzes article sentiment (positive/negative/neutral)
- **Beautiful UI** - Modern, responsive React frontend with smooth animations
- **Redis Storage** - Fast, scalable storage with Redis Stack
- **Real-time Updates** - Live news updates with refresh functionality

## 🏗️ Architecture

```
Frontend (React + Vite) ←→ Backend API (Express) ←→ Redis Stack
                                    ↓
                            NewsAPI + Gemini AI
```

## 📁 Project Structure

```
news_summarise/
├── backend/                 # Node.js backend
│   ├── index.js            # Main news processing script
│   ├── api.js              # Express API server
│   ├── newsFetcher.js      # NewsAPI integration
│   ├── geminiClient.js     # Google Gemini AI integration
│   ├── redisClient.js      # Redis connection & operations
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   └── App.css         # Styling
│   └── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Redis Stack (for data storage)
- NewsAPI key (free at [newsapi.org](https://newsapi.org))
- Google Gemini API key (free at [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "NEWSAPI_KEY=your_newsapi_key
GEMINI_API_KEY=your_gemini_api_key
REDIS_URL=redis://localhost:6379
PORT=3001" > .env

# Start Redis Stack (if not running)
# Download from: https://redis.io/docs/stack/

# Start the news processor
node index.js

# In another terminal, start the API server
node api.js
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
NEWSAPI_KEY=your_newsapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
REDIS_URL=redis://localhost:6379
PORT=3001
```

### API Endpoints

- `GET /api/news` - Get all news articles
- `GET /api/news/sentiment/:sentiment` - Get news by sentiment
- `GET /api/health` - Health check

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Sentiment Indicators** - Color-coded sentiment badges with icons
- **Real-time Refresh** - Manual refresh button with loading states
- **Error Handling** - Graceful error messages and fallback data
- **Smooth Animations** - Loading spinners and hover effects

## 🔄 How It Works

1. **News Fetching**: Backend fetches news from NewsAPI every 10 minutes
2. **AI Processing**: Each article is sent to Gemini for summarization and sentiment analysis
3. **Storage**: Processed articles are stored in Redis Stack as JSON
4. **API Serving**: Express server provides REST API endpoints
5. **Frontend Display**: React app fetches and displays news with beautiful UI

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Heroku, Railway, or DigitalOcean
- Set up Redis Cloud or AWS ElastiCache for Redis
- Configure environment variables

### Frontend Deployment
- Build: `npm run build`
- Deploy to Vercel, Netlify, or any static hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use this project for your own applications!

## 🆘 Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis Stack is running
   - Check Redis URL in .env file

2. **API Key Errors**
   - Verify NewsAPI and Gemini API keys are correct
   - Check API quotas and limits

3. **Frontend Not Loading Data**
   - Ensure backend API server is running on port 3001
   - Check browser console for CORS errors

### Getting Help

- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed

---

**Happy coding! 🎉**