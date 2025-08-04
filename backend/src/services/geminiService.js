require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

// Initialize separate clients for different operations
const aiSummary = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_SUMMARY || process.env.GEMINI_API_KEY });
const aiSummary2 = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_SUMMARY2 || process.env.GEMINI_API_KEY });
const aiEmbedding = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_EMBEDDING || process.env.GEMINI_API_KEY });

// Rate limiting variables
let summaryCallCount = 0;
let summary2CallCount = 0;
let embeddingCallCount = 0;
const RATE_LIMIT_DELAY = 1000; // 1 second between calls
const MAX_CALLS_PER_MINUTE = 20;
let currentSummaryKey = 1; // 1 for first key, 2 for second key

// Helper function to add delay between API calls
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate limiter for summary operations with key rotation
async function rateLimitedSummaryCall(callFunction) {
  // Check if current key is at rate limit
  const currentCount = currentSummaryKey === 1 ? summaryCallCount : summary2CallCount;
  
      if (currentCount >= MAX_CALLS_PER_MINUTE) {
      // Try switching to the other key
      if (currentSummaryKey === 1 && summary2CallCount < MAX_CALLS_PER_MINUTE) {
        console.log(`Summary API key 1 at limit (${summaryCallCount}/${MAX_CALLS_PER_MINUTE}), switching to key 2...`);
        currentSummaryKey = 2;
      } else if (currentSummaryKey === 2 && summaryCallCount < MAX_CALLS_PER_MINUTE) {
        console.log(`Summary API key 2 at limit (${summary2CallCount}/${MAX_CALLS_PER_MINUTE}), switching to key 1...`);
        currentSummaryKey = 1;
      } else {
        console.log(`Both summary API keys at rate limit (Key1: ${summaryCallCount}/${MAX_CALLS_PER_MINUTE}, Key2: ${summary2CallCount}/${MAX_CALLS_PER_MINUTE}), waiting...`);
        await delay(60000); // Wait 1 minute
        summaryCallCount = 0;
        summary2CallCount = 0;
      }
    }
  
  await delay(RATE_LIMIT_DELAY);
  
  // Increment the appropriate counter
  if (currentSummaryKey === 1) {
    summaryCallCount++;
  } else {
    summary2CallCount++;
  }
  
  return await callFunction();
}

// Rate limiter for embedding operations
async function rateLimitedEmbeddingCall(callFunction) {
  if (embeddingCallCount >= MAX_CALLS_PER_MINUTE) {
    console.log('Embedding API rate limit reached, waiting...');
    await delay(60000); // Wait 1 minute
    embeddingCallCount = 0;
  }
  
  await delay(RATE_LIMIT_DELAY);
  embeddingCallCount++;
  return await callFunction();
}

async function summarizeAndAnalyze(title, content) {
  const prompt = `You are an intelligent assistant helping categorize news articles.
  
Given the following news content, do the following:
1. Summarize it in 2-3 sentences.
2. Determine its sentiment (positive, negative, or neutral).
3. Generate 10-15 relevant keywords or key phrases for search and categorization. These keywords should reflect the *topic*, *context*, and *implications*, even if they are *not directly mentioned* in the article. Include related people, events, organizations, or terms.

Title: ${title}
Content: ${content}

Respond in strict JSON format like this:
{
  "summary": "...",
  "sentiment": "...",
  "keywords": ["...", "...", "..."]
}`;

  return await rateLimitedSummaryCall(async () => {
    try {
      // Use the appropriate API key based on current rotation
      const aiClient = currentSummaryKey === 1 ? aiSummary : aiSummary2;
      console.log(`Using summary API key ${currentSummaryKey} for article processing`);
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash-lite", // Updated to 2.5 flash-lite
        contents: prompt,
      });

      let text = response.text.trim();

      // Remove markdown code block if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(text);
    } catch (e) {
      console.error('Error calling Gemini Summary API:', e);
      return { summary: '', sentiment: 'neutral', keywords: [] };
    }
  });
}

// Generate an embedding vector using the dedicated embedding API key
async function generateEmbedding(text) {
  return await rateLimitedEmbeddingCall(async () => {
    try {
      const response = await aiEmbedding.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        outputDimensionality: 768
      });

      return response.embeddings[0].values;
    } catch (e) {
      console.error('Error generating embedding with primary method:', e);
      // Fallback to direct API call if needed
      return await generateEmbeddingDirect(text);
    }
  });
}

// Fallback direct API call for embeddings
async function generateEmbeddingDirect(text) {
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=' + process.env.GEMINI_API_KEY_EMBEDDING;
    const body = {
      content: { parts: [{ text }] }
    };
    const response = await axios.post(url, body);
    
    const embedding = response.data.embedding.values;
    
    if (!Array.isArray(embedding)) {
      console.error('Expected array, got:', typeof embedding);
      return [];
    }
    
    return embedding;
  } catch (e) {
    console.error('Error generating embedding with direct API:', e?.response?.data || e);
    return [];
  }
}

// Extract keywords from news content using the summary API key
async function extractKeywords(title, description = '', content = '') {
  const prompt = `Extract 5-8 most important keywords from this news article. Focus on:
- Main topics/subjects
- Key entities (people, places, organizations)
- Important concepts or technologies
- Current events or trends mentioned

Title: ${title}
Description: ${description}
Content: ${content}

Return only the keywords as a JSON array, no explanations:
["keyword1", "keyword2", "keyword3", ...]`;

  return await rateLimitedSummaryCall(async () => {
    try {
      // Use the appropriate API key based on current rotation
      const aiClient = currentSummaryKey === 1 ? aiSummary : aiSummary2;
      console.log(`Using summary API key ${currentSummaryKey} for keyword extraction`);
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash-lite", // Updated to 2.5 flash-lite
        contents: prompt,
      });
      
      const text = response.text;
      
      // Clean up the response - remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const keywords = JSON.parse(jsonText);
      
      // Validate that it's an array of strings
      if (Array.isArray(keywords) && keywords.every(k => typeof k === 'string')) {
        console.log('Extracted keywords:', keywords);
        return keywords;
      } else {
        throw new Error('Invalid keywords format');
      }
    } catch (e) {
      console.error('Error extracting keywords:', e);
      // Fallback: extract basic keywords from title
      const fallbackKeywords = title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !isStopWord(word))
        .slice(0, 5);
      
      console.log('Using fallback keywords:', fallbackKeywords);
      return fallbackKeywords;
    }
  });
}

// Simple stop words for fallback keyword extraction
function isStopWord(word) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'have', 'will', 'from', 'they',
    'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there',
    'could', 'other', 'than', 'first', 'very', 'after', 'where', 'most', 'over',
    'even', 'much', 'make', 'before', 'great', 'back', 'through', 'years', 'should',
    'well', 'people', 'down', 'just', 'because', 'good', 'those', 'feel', 'seem',
    'how', 'high', 'too', 'place', 'little', 'world', 'still', 'nation', 'hand',
    'life', 'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between',
    'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing',
    'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number',
    'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'child',
    'small', 'since', 'against', 'late', 'hard', 'major', 'example', 'hear', 'talk',
    'report', 'today', 'bring', 'tomorrow', 'carry', 'clear', 'above', 'news', 'article'
  ]);
  
  return stopWords.has(word);
}

// Reset rate limit counters every minute
let resetInterval = null;

// Function to start the reset interval
function startRateLimitReset() {
  if (!resetInterval) {
    resetInterval = setInterval(() => {
      summaryCallCount = 0;
      summary2CallCount = 0;
      embeddingCallCount = 0;
      console.log('Rate limit counters reset');
    }, 60000);
    console.log('Rate limit reset interval started');
  }
}

// Function to stop the reset interval
function stopRateLimitReset() {
  if (resetInterval) {
    clearInterval(resetInterval);
    resetInterval = null;
    console.log('Rate limit reset interval stopped');
  }
}

module.exports = { 
  summarizeAndAnalyze, 
  generateEmbedding, 
  extractKeywords,
  generateEmbeddingDirect,
  startRateLimitReset,
  stopRateLimitReset
};