require('dotenv').config();
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });
console.log('Deleting search index...');
redis.ft.dropIndex('idx:news');
console.log('Search index deleted');