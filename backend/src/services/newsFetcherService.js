require('dotenv').config();
const axios = require('axios');

const NEWSAPI_URL = 'https://newsapi.org/v2/everything';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

async function fetchNews(query = 'india', pageSize = 5) {
  const params = {
    q: query,
    apiKey: NEWSAPI_KEY,
    pageSize,
    sortBy: 'publishedAt',
    language: 'en',
    sortBy: 'publishedAt'
  };
  const response = await axios.get(NEWSAPI_URL, { params });
  return response.data.articles;
}

module.exports = { fetchNews }; 