const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const deepseekAI = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const conversationHistories = {};

router.post('/generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      console.error('AI API error: Invalid prompt', { prompt });
      return res.status(400).json({ error: 'Invalid prompt provided' });
    }
    
    const conversationHistory = options.conversationHistory || [];
    
    const formattingInstructions = "Respond in a natural, conversational way. Do not use markdown formatting like bold (**), italic (*), code blocks (```), or other special formatting. Just use plain text in your response.";
    
    let messages = [
      { role: "system", content: formattingInstructions }
    ];
    
    if (conversationHistory.length > 0) {
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      messages = [...messages, ...formattedHistory];
    }
    
    messages.push({ role: "user", content: prompt });
    
    const model = options.model || 'deepseek-chat';
    const maxTokens = options.maxTokens || 10000;
    const temperature = options.temperature || 0.7;
    
    console.log(`AI Request - Prompt: "${prompt.substring(0, 50)}..." with model: ${model}`);
    console.log(`AI Request options:`, { 
      maxTokens, 
      temperature,
      conversationLength: messages.length 
    });
    
    const completion = await deepseekAI.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    console.log('AI Response received:', {
      usage: completion.usage,
      model: completion.model,
      responseLength: aiResponse.length,
      responseSample: aiResponse.substring(0, 30) + "..."
    });
    
    res.json({ 
      response: aiResponse,
      usage: completion.usage
    });
    
  } catch (error) {
    console.error('AI API error:', error);
    
    const errorDetails = {
      error: 'Failed to generate response',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    if (error.message && error.message.includes('rate limit')) {
      errorDetails.suggestion = 'The AI service is currently experiencing high demand. Please try again in a moment.';
    }
    
    if (error.message && error.message.includes('api key')) {
      errorDetails.suggestion = 'There might be an issue with the API configuration. Please contact the administrator.';
    }
    
    res.status(500).json(errorDetails);
  }
});

router.post('/clear-history', (req, res) => {
  const conversationId = req.session?.id || 'default';
  if (conversationHistories[conversationId]) {
    delete conversationHistories[conversationId];
  }
  res.json({ success: true, message: 'Conversation history cleared' });
});

router.get('/test', async (req, res) => {
  try {
    const testPrompt = req.query.prompt || "Give me three brief health tips for someone trying to lose weight";
    
    console.log(`Running AI test with prompt: "${testPrompt}"`);
    
    const completion = await deepseekAI.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: "user", content: testPrompt }],
      max_tokens: 200,
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content;
    
    console.log('--- AI TEST RESULTS ---');
    console.log('Prompt:', testPrompt);
    console.log('Response:', response);
    console.log('Token usage:', completion.usage);
    console.log('------------------------');
    
    res.json({ 
      success: true,
      prompt: testPrompt,
      response: response,
      usage: completion.usage
    });
  } catch (error) {
    console.error('AI Test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: "Check your DEEPSEEK_API_KEY in the .env file and ensure it's valid"
    });
  }
});

module.exports = router;