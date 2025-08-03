require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
    console.error('Error calling Gemini API:', e);
    console.error('Raw response:', response?.text);
    return { summary: '', sentiment: 'neutral', keywords: [] };
  }
}


// Generate an embedding vector for a given text using Gemini
async function generateEmbedding(text) {
  try {
     const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        outputDimensionality: 768
    });

    // Gemini returns { embeddings: [ { values: [...] } ] }
    // console.log(response.embeddings[0].values);
    return response.embeddings[0].values;
  } catch (e) {
    console.error('Error generating embedding:', e);
    return [];
  }
}

// Extract keywords from news content using Gemini
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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

module.exports = { summarizeAndAnalyze, generateEmbedding, extractKeywords }; 