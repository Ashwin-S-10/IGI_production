// Test Gemini API directly
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testGemini() {
  const prompt = `You are an automated evaluator.
Evaluate the user's answer strictly.

Question:
What is 2 + 2?

Expected Answer:
4

User Answer:
4

Scoring rules:
- Score must be an integer between 0 and 10
- 10 = completely correct with clear logic
- Partial correctness should receive proportional score
- Incorrect or irrelevant answer = low score
- Do NOT explain
- Do NOT add text
- Return ONLY the numeric score.`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    console.log('\nCalling Gemini API...');
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('\nExtracted text:', text);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGemini();
