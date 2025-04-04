import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar.jsx';
import { generateAIResponse, clearConversationHistory } from './services/aiServices';
import { classifyUserPrompt, extractMacroInfo, generateWorkoutPrompt, generateHealthTipsPrompt, generateMealPrompt } from './services/promptServiceAI';
import './AiChat.css';

const AiChat = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]);
  const [chatMode, setChatMode] = useState('input'); // 'input' or 'quick'
  const [dietMessages, setDietMessages] = useState({});
  const [macroInfo, setMacroInfo] = useState({});

  // Effect to extract macro info when a diet-related message is added
  useEffect(() => {
    const extractDietInfo = async () => {
      const dietRelatedMessages = conversation.filter(msg => msg.role === 'assistant' && msg.isDietRelated);
      if (dietRelatedMessages.length === 0) return;
      
      const latestMessage = dietRelatedMessages[dietRelatedMessages.length - 1];
      if (!latestMessage.id || !dietMessages[latestMessage.id]) return;
      
      // If we already have macro info for this message, don't re-extract
      if (macroInfo[latestMessage.id]) return;
      
      try {
        const { userQuery, aiResponse } = dietMessages[latestMessage.id];
        const extractedInfo = await extractMacroInfo(userQuery, aiResponse);
        
        if (extractedInfo) {
          setMacroInfo(prev => ({
            ...prev,
            [latestMessage.id]: extractedInfo
          }));
        }
      } catch (error) {
        console.error('Error extracting diet info:', error);
      }
    };
    
    extractDietInfo();
  }, [conversation, dietMessages]);

  // Handler for the "Add to Diet" button
  const handleAddToDiet = async (messageId) => {
    try {
      const messageInfo = dietMessages[messageId];
      if (!messageInfo) return;
      
      // Show loading state
      setLoading(true);
      
      // Use cached macro info if available, otherwise extract it
      let macroData = macroInfo[messageId];
      
      if (!macroData) {
        const { userQuery, aiResponse } = messageInfo;
        macroData = await extractMacroInfo(userQuery, aiResponse);
        
        if (macroData) {
          // Cache the extracted data
          setMacroInfo(prev => ({
            ...prev,
            [messageId]: macroData
          }));
        }
      }
      
      if (macroData) {
        // Navigate to the Import page with the extracted information
        navigate('/import', {
          state: {
            formType: 'diet',
            macroInfo: macroData
          }
        });
      } else {
        setError('Could not extract nutritional information. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to diet:', error);
      setError('Failed to process diet information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format nutrition info for display
  const formatNutritionInfo = (info) => {
    if (!info) return null;
    
    return (
      <div className="nutrition-info">
        <h4>{info.meal_name}</h4>
        <ul>
          <li><strong>Calories:</strong> {info.calories}</li>
          <li><strong>Protein:</strong> {info.protein_g}g</li>
          <li><strong>Carbs:</strong> {info.carbs_g}g</li>
          <li><strong>Fats:</strong> {info.fats_g}g</li>
        </ul>
      </div>
    );
  };

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
      
      // First, classify if this is a diet-related query
      const messageType = await classifyUserPrompt(currentPrompt);
      console.log("Classification result:", messageType);
      
      // Get the normal AI response to display to the user
      // Use a fresh conversation without classification history to avoid confusion
      const result = await generateAIResponse(currentPrompt, {
        temperature: 0.7,
        maxTokens: 2000, // Ensure we have enough tokens for a complete response
        freshConversation: true // Signal to server this should be a clean conversation
      });
      
      if (!result || !result.response) {
        throw new Error("Received empty response from AI service");
      }
      
      console.log("AI response received:", result.response.substring(0, 50) + "...");
      
      // Generate a unique ID for this message pair
      const messageId = Date.now().toString();
      
      // Add AI response to conversation with classification info
      const aiMessage = { 
        id: messageId,
        role: 'assistant', 
        content: result.response,
        isDietRelated: messageType === 'diet'
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      // If this is a diet-related message, store the context for later use
      if (messageType === 'diet') {
        setDietMessages(prev => ({
          ...prev,
          [messageId]: {
            userQuery: currentPrompt,
            aiResponse: result.response
          }
        }));
      }
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
      
      const healthTipsPrompt = generateHealthTipsPrompt(mockUserStats);
      const result = await generateAIResponse(healthTipsPrompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      
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
      const userQuery = 'Suggest a balanced, nutritious meal without artificial sweeteners.';
      const userMessage = { role: 'user', content: userQuery };
      setConversation(prev => [...prev, userMessage]);
      
      const mealPrompt = generateMealPrompt(
        ['balanced', 'nutritious'], 
        ['artificial sweeteners']
      );
      
      const result = await generateAIResponse(mealPrompt, {
        temperature: 0.8,
        maxTokens: 250
      });
      
      // Generate a unique ID for this message pair
      const messageId = Date.now().toString();
      
      // Add AI response to conversation
      const aiMessage = { 
        id: messageId,
        role: 'assistant', 
        content: result.response,
        isDietRelated: true
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      // Store this message for later extraction
      setDietMessages(prev => ({
        ...prev,
        [messageId]: {
          userQuery,
          aiResponse: result.response
        }
      }));
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
      
      const workoutPrompt = generateWorkoutPrompt("30", "moderate");
      const result = await generateAIResponse(workoutPrompt, {
        temperature: 0.7,
        maxTokens: 1000
      });
      
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
      // Clear stored diet messages
      setDietMessages({});
      // Clear macro info
      setMacroInfo({});
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
                
                {/* Display nutrition info if available for diet messages */}
                {message.role === 'assistant' && message.isDietRelated && macroInfo[message.id] && (
                  <div className="nutrition-display">
                    <hr />
                    {formatNutritionInfo(macroInfo[message.id])}
                  </div>
                )}
              </div>
              
              {/* Add to Diet button below the message bubble */}
              {message.role === 'assistant' && message.isDietRelated && (
                <div className="message-actions-below">
                  <button 
                    className="add-to-diet-button"
                    onClick={() => handleAddToDiet(message.id)}
                  >
                    Add to Diet
                  </button>
                </div>
              )}
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