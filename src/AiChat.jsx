import React, { useState } from 'react';
import SideBar from './SideBar.jsx';
import { generateAIResponse, generateHealthTips, generateMealSuggestion, clearConversationHistory } from './services/aiServices';
import './AiChat.css';

const AiChat = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]);
  const [chatMode, setChatMode] = useState('input'); // 'input' or 'quick'

  // Send message using the AI service
  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Add user message to conversation
      const userMessage = { role: 'user', content: prompt };
      setConversation(prev => [...prev, userMessage]);
      
      // Store prompt before clearing it
      const currentPrompt = prompt;
      setPrompt(''); // Clear input field immediately for better UX
      
      const result = await generateAIResponse(currentPrompt, {
        temperature: 0.7,
        maxTokens: 2000 // Ensure we have enough tokens for a complete response
      });
      
      if (!result || !result.response) {
        throw new Error("Received empty response from AI service");
      }
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: result.response };
      setConversation(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      setError(err.message || "Failed to get response from AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get health tips
  const getHealthTips = async () => {
    setLoading(true);
    setError('');
    
    try {
      const mockUserStats = {
        steps: 7500,
        duration_min: 35,
        calories: 2200,
        protein_g: 80,
        carbs_g: 250,
        fats_g: 70,
        calories_burned: 350
      };

      // Add user query to conversation
      const userMessage = { role: 'user', content: 'Give me a health tip based on my activity data.' };
      setConversation(prev => [...prev, userMessage]);
      
      const result = await generateHealthTips(mockUserStats);
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: result.response };
      setConversation(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get health tips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get meal suggestion
  const getMealSuggestion = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Add user query to conversation
      const userMessage = { role: 'user', content: 'Suggest a balanced, nutritious meal without artificial sweeteners.' };
      setConversation(prev => [...prev, userMessage]);
      
      const result = await generateMealSuggestion(
        ['balanced', 'nutritious'], 
        ['artificial sweeteners']
      );
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: result.response };
      setConversation(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get meal suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get workout suggestion
  const getWorkoutSuggestion = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Add user query to conversation
      const userMessage = { role: 'user', content: 'Suggest a 30-minute home workout routine.' };
      setConversation(prev => [...prev, userMessage]);
      
      const result = await generateAIResponse(
        'Suggest a 30-minute moderate intensity home workout routine that requires no equipment. Make it brief and structured.',
        { temperature: 0.7, maxTokens: 1000 }
      );
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: result.response };
      setConversation(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get workout suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing chat history
  const handleClearChat = async () => {
    try {
      setLoading(true);
      
      await clearConversationHistory();
      
      // Clear the local conversation state
      setConversation([]);
    } catch (err) {
      setError(err.message || "Failed to clear chat history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SideBar />
      <div className="ai-chat-container">
        <h3 className='ai-chat-title'>AI Health Coach</h3>
        
        <div className="chat-conversation">
          {conversation.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              <div className="message-bubble">
                {message.content}
              </div>
            </div>
          ))}
          {conversation.length === 0 && (
            <div className="chat-empty-state">
              Start a conversation by typing a message below or using one of the quick actions.
            </div>
          )}
        </div>
        
        <div className="chat-toggle-container">
          <button 
            className={`chat-toggle-btn ${chatMode === 'input' ? 'active' : ''}`}
            onClick={() => setChatMode('input')}
          >
            Input Chat
          </button>
          <button 
            className={`chat-toggle-btn ${chatMode === 'quick' ? 'active' : ''}`}
            onClick={() => setChatMode('quick')}
          >
            Quick Chat
          </button>
        </div>
        
        {chatMode === 'input' ? (
          <div className="chat-input-container">
            <h3>Ask Health Assistant</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about health, nutrition, or fitness..."
              className="chat-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            
            <div className="button-container">
              <button 
                onClick={sendMessage} 
                disabled={loading || !prompt.trim()}
                className="chat-button primary-button"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              
              <button 
                onClick={handleClearChat} 
                disabled={loading || conversation.length === 0}
                className="chat-button clear-button"
              >
                Clear Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="quick-chat-container">
            <h3>Quick Actions</h3>
            <div className="button-container">
              <button 
                onClick={getHealthTips} 
                disabled={loading}
                className="chat-button health-button"
              >
                Get Health Tips
              </button>
              
              <button 
                onClick={getMealSuggestion} 
                disabled={loading}
                className="chat-button meal-button"
              >
                Get Meal Ideas
              </button>
              
              <button 
                onClick={getWorkoutSuggestion} 
                disabled={loading}
                className="chat-button workout-button"
              >
                Get Workout Plan
              </button>
              
              <button 
                onClick={handleClearChat} 
                disabled={loading || conversation.length === 0}
                className="chat-button clear-button"
              >
                Clear Chat
              </button>
            </div>
          </div>
        )}
        
        {loading && <p className="loading-indicator">Processing your request...</p>}
        
        {error && (
          <div className="error-container">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </>
  );
};

export default AiChat; 