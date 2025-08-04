#!/usr/bin/env node

require('dotenv').config();
const { processNews } = require('../src/services/newsProcessor');

async function main() {
  try {
    console.log('Starting news processing...');
    console.log('Time:', new Date().toISOString());
    
    await processNews();
    
    console.log('News processing completed successfully');
    console.log('Time:', new Date().toISOString());
    process.exit(0);
  } catch (error) {
    console.error('News processing failed:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 