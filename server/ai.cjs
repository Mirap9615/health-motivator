const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the OpenAI client but configure it to use DeepSeek's API
const deepseekAI = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1', // DeepSeek's API endpoint
});

// Maintain conversation history for each session
const conversationHistories = {};

// Create an endpoint to handle AI requests
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      console.error('AI API error: Invalid prompt', { prompt });
      return res.status(400).json({ error: 'Invalid prompt provided' });
    }
    
    // Get or create conversation ID
    const conversationId = req.session?.id || 'default';
    
    // Get or initialize conversation history
    if (!conversationHistories[conversationId]) {
      conversationHistories[conversationId] = [];
    }
    
    // Add conversation style instructions to prevent formatting
    const formattingInstructions = "Respond in a natural, conversational way. Do not use markdown formatting like bold (**), italic (*), code blocks (```), or other special formatting. Just use plain text in your response.";
    
    // Handle freshConversation option - start a new conversation for this prompt only
    let messages;
    if (options.freshConversation) {
      // Use only this message without history, add system message with instructions
      messages = [
        { role: "system", content: formattingInstructions },
        { role: "user", content: prompt }
      ];
      console.log(`Using fresh conversation for prompt: "${prompt.substring(0, 50)}..."`);
    } else {
      // For ongoing conversations, check if we've already added instructions
      if (conversationHistories[conversationId].length === 0 || 
          conversationHistories[conversationId][0].role !== "system") {
        // Prepend system message with instructions if not already present
        conversationHistories[conversationId] = [
          { role: "system", content: formattingInstructions },
          ...conversationHistories[conversationId]
        ];
      }
      
      // Add user message to history
      conversationHistories[conversationId].push({ role: "user", content: prompt });
      // Use full conversation history
      messages = [...conversationHistories[conversationId]];
    }
    
    // Set default parameters
    const model = options.model || 'deepseek-chat'; // Use the appropriate DeepSeek model name
    const maxTokens = options.maxTokens || 10000;
    const temperature = options.temperature || 0.7;
    
    console.log(`AI Request - Prompt: "${prompt.substring(0, 50)}..." with model: ${model}`);
    console.log(`AI Request options:`, { 
      maxTokens, 
      temperature, 
      freshConversation: options.freshConversation,
      conversationLength: messages.length 
    });
    
    // Call the DeepSeek API using OpenAI client with the conversation history
    const completion = await deepseekAI.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    });
    
    // Add AI response to conversation history (only if not using freshConversation)
    const aiResponse = completion.choices[0].message.content;
    
    if (!options.freshConversation) {
      conversationHistories[conversationId].push({ role: "assistant", content: aiResponse });
      
      // Truncate history if it gets too long (keep last 10 messages)
      if (conversationHistories[conversationId].length > 10) {
        conversationHistories[conversationId] = conversationHistories[conversationId].slice(-10);
      }
    }
    
    console.log('AI Response received:', {
      usage: completion.usage,
      model: completion.model,
      responseLength: aiResponse.length,
      responseSample: aiResponse.substring(0, 30) + "..."
    });
    
    // Return the response
    res.json({ 
      response: aiResponse,
      usage: completion.usage
    });
    
  } catch (error) {
    console.error('AI API error:', error);
    
    // More detailed error response
    const errorDetails = {
      error: 'Failed to generate response',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('rate limit')) {
      errorDetails.suggestion = 'The AI service is currently experiencing high demand. Please try again in a moment.';
    }
    
    // Check if it's an API key error
    if (error.message && error.message.includes('api key')) {
      errorDetails.suggestion = 'There might be an issue with the API configuration. Please contact the administrator.';
    }
    
    res.status(500).json(errorDetails);
  }
});

// Add an endpoint to clear conversation history
router.post('/clear-history', (req, res) => {
  const conversationId = req.session?.id || 'default';
  if (conversationHistories[conversationId]) {
    delete conversationHistories[conversationId];
  }
  res.json({ success: true, message: 'Conversation history cleared' });
});

// Add a simple test route for direct testing
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