# NewsHub API Documentation

## Overview

The NewsHub API provides comprehensive news aggregation and personalization services. This API is built with Express.js and includes features like news fetching, sentiment analysis, user personalization, and caching.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://newshub-backend.vercel.app`

## API Documentation

### Interactive Documentation

The API documentation is available at:
- **Swagger UI**: `/api-docs`
- **OpenAPI JSON**: `/api-docs/swagger.json`

### Authentication

Currently, the API supports anonymous access with user ID generation for personalization features.

## Endpoints

### News Endpoints

#### Get All News
```
GET /api/news
```

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page
- `sort` (string, enum: latest, oldest, relevance, default: latest): Sort order

#### Get News by Topic
```
GET /api/news/topic/{topic}
```

**Path Parameters:**
- `topic` (string, required): Topic to filter by (e.g., politics, technology, sports)

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page

#### Get News by Sentiment
```
GET /api/news/sentiment/{sentiment}
```

**Path Parameters:**
- `sentiment` (string, required, enum: positive, negative, neutral): Sentiment to filter by

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page

#### Search News
```
GET /api/news/search
```

**Query Parameters:**
- `q` (string, required): Search query
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page
- `topic` (string, optional): Filter by topic
- `sentiment` (string, optional, enum: positive, negative, neutral): Filter by sentiment
- `dateFrom` (string, optional, format: YYYY-MM-DD): Filter by start date
- `dateTo` (string, optional, format: YYYY-MM-DD): Filter by end date

#### Get Trending Articles
```
GET /api/news/trending
```

**Query Parameters:**
- `limit` (integer, default: 10): Number of trending articles to return
- `period` (string, enum: 1h, 24h, 7d, default: 24h): Time period for trending calculation

#### Get Article by ID
```
GET /api/news/{id}
```

**Path Parameters:**
- `id` (string, required): Article ID

#### Get Similar Articles
```
GET /api/news/{id}/similar
```

**Path Parameters:**
- `id` (string, required): Article ID to find similar articles for

**Query Parameters:**
- `limit` (integer, default: 5): Number of similar articles to return

#### Get Article Metrics
```
GET /api/news/{id}/metrics
```

**Path Parameters:**
- `id` (string, required): Article ID

### User Endpoints

#### Generate User ID
```
POST /api/user/generate-id
```

#### Store User Preferences
```
POST /api/user/{userId}/preferences
```

**Path Parameters:**
- `userId` (string, required): User ID

**Request Body:**
```json
{
  "topics": ["politics", "technology"],
  "sources": ["BBC", "CNN"],
  "sentiment": "positive"
}
```

#### Get User Preferences
```
GET /api/user/{userId}/preferences
```

**Path Parameters:**
- `userId` (string, required): User ID

#### Update User Preferences
```
PUT /api/user/{userId}/preferences
```

**Path Parameters:**
- `userId` (string, required): User ID

**Request Body:** Same as POST

#### Get Personalized News
```
GET /api/user/{userId}/personalized-news
```

**Path Parameters:**
- `userId` (string, required): User ID

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page

#### Search Personalized News
```
GET /api/user/{userId}/personalized-news/search
```

**Path Parameters:**
- `userId` (string, required): User ID

**Query Parameters:**
- `q` (string, required): Search query
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page

#### Get User Article History
```
GET /api/user/{userId}/history
```

**Path Parameters:**
- `userId` (string, required): User ID

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 20): Number of articles per page

### Metadata Endpoints

#### Get Available Topics
```
GET /api/metadata/topics
```

#### Get Available Sentiments
```
GET /api/metadata/sentiments
```

#### Get Available Sources
```
GET /api/metadata/sources
```

### Health Endpoints

#### Health Check
```
GET /api/health
```

### Admin Endpoints

#### Get Similar Articles Statistics
```
GET /api/admin/similar-stats/{id}
```

**Path Parameters:**
- `id` (string, required): Article ID

#### Clear Similar Articles Cache
```
GET /api/admin/clear-similar-cache/{id}
```

**Path Parameters:**
- `id` (string, required): Article ID

#### Clear All Cache Except User Data
```
POST /api/admin/clear-all-cache-except-user
```

#### Clear Specific Cache Types
```
POST /api/admin/clear-specific-cache-types
```

**Request Body:**
```json
{
  "cacheTypes": ["news", "similar", "trending", "search"]
}
```

#### Get Cache Statistics
```
GET /api/admin/cache-statistics
```

## Data Models

### Article
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "content": "string",
  "url": "string",
  "imageUrl": "string",
  "publishedAt": "date-time",
  "source": "string",
  "topic": "string",
  "sentiment": "positive|negative|neutral",
  "score": "number"
}
```

### Pagination
```json
{
  "page": "number",
  "limit": "number",
  "total": "number",
  "totalPages": "number"
}
```

### Error
```json
{
  "error": "string",
  "status": "number"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "articles": [...],
  "pagination": {...}
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 400
}
```

## Rate Limiting

Currently, there are no rate limits implemented, but they may be added in future versions.

## Caching

The API uses Redis for caching to improve performance. Cache keys are automatically managed and can be cleared through admin endpoints.

## Error Codes

- `200`: Success
- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

## Development

### Running the API

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the API documentation:
   ```
   http://localhost:3001/api-docs
   ```

### Testing

The API includes comprehensive test coverage. Run tests with:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License. 