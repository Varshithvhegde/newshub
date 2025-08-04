const axios = require('axios');

async function testCORS() {
  const testUrls = [
    'http://localhost:8080',
    'https://newshub-henna.vercel.app'
  ];

  console.log('🧪 Testing CORS configuration...\n');

  for (const origin of testUrls) {
    try {
      console.log(`Testing origin: ${origin}`);
      
      const response = await axios.get('http://localhost:3001/api/health', {
        headers: {
          'Origin': origin
        }
      });
      
      console.log(`✅ Success for ${origin}`);
      console.log(`Response: ${response.status} - ${response.data.status}\n`);
    } catch (error) {
      console.log(`❌ Error for ${origin}: ${error.message}\n`);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCORS();
}

module.exports = { testCORS }; 