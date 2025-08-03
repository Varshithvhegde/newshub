require('dotenv').config();
const cron = require('node-cron');
const { fetchNews } = require('./src/services/newsFetcherService');
const { summarizeAndAnalyze, generateEmbedding } = require('./src/services/geminiService');
const { storeArticle, articleExists } = require('./src/services/redisService');
const crypto = require('crypto');
const axios = require('axios');

// Start the API server
require('./src/app');

async function generateEmbedding1(text) {
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=' + process.env.GEMINI_API_KEY;
    const body = {
      content: { parts: [{ text }] }
    };
    const response = await axios.post(url, body);
    
    // Debug logging
    console.log('API Response structure:', JSON.stringify(response.data, null, 2));
    console.log('Embedding path exists:', !!response.data.embedding?.values);
    console.log('Raw embedding length:', response.data.embedding?.values?.length);
    
    const embedding = response.data.embedding.values;
    
    // Additional validation
    if (!Array.isArray(embedding)) {
      console.error('Expected array, got:', typeof embedding);
      return [];
    }
    
    return embedding;
  } catch (e) {
    console.error('Error generating embedding:', e?.response?.data || e);
    return [];
  }
}
async function processNews() {
  console.log('Fetching news for multiple topics...');
  
  // Popular topics to fetch news for
  const topics = [
    'India',
    'Technology', 
    'World',
    'Sports',
    'Business',
    'Entertainment',
    'Science',
    'Health'
  ];
  
  const allArticles = [];
  
  // Fetch news for each topic
  for (const topic of topics) {
    try {
      console.log(`Fetching news for: ${topic}`);
      const articles = await fetchNews(topic, 8); // 8 articles per topic
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Error fetching news for ${topic}:`, error);
    }
  }
  
  console.log(`Total articles fetched: ${allArticles.length}`);
  
  // Process all articles
  for (const article of allArticles) {
    // Use a hash of title+publishedAt as unique ID
    const id = crypto.createHash('sha256').update(article.title + article.publishedAt).digest('hex');
    if (await articleExists(id)) {
      console.log(`Skipping duplicate: ${article.title}`);
      continue;
    }
    const { summary, sentiment, keywords } = await summarizeAndAnalyze(article.title, article.content || article.description || '');
    // Generate embedding vector for title + content
    const embeddingText = `${article.title} ${article.content || article.description || ''}`;
    const vector = await generateEmbedding(embeddingText);
    const newsObj = {
      id,
      title: article.title,
      content: article.content,
      summary,
      sentiment,
      keywords,
      source: article.source, // Save full source object
      publishedAt: article.publishedAt,
      url: article.url,
      urlToImage: article.urlToImage,
      vector,
      author: article.author || null,
      description: article.description || null
    };
    await storeArticle(newsObj);
    console.log(`Stored: ${article.title}`);
  }
}

// // Run every 10 minutes
// cron.schedule('*/10 * * * *', processNews);

// // Run once at startup
// processNews(); 