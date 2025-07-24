// Test OpenAI API key
// Run with: node test-openai.js

const API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // Replace with your actual key

async function testOpenAI() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (response.ok) {
      console.log('✅ API key is valid!');
      const data = await response.json();
      console.log('Available models:', data.data.map(m => m.id).slice(0, 5).join(', '), '...');
    } else {
      console.log('❌ API key is invalid or expired');
      console.log('Status:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.error('Failed to test API:', error);
  }
}

testOpenAI();