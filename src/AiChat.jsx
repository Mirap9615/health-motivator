import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar.jsx';
import { generateAIResponse, clearConversationHistory } from './services/aiServices';
import { classifyUserPrompt, extractMacroInfo, extractMealPlannerInfo, generateWorkoutPrompt, generateHealthTipsPrompt, generateMealPrompt } from './services/promptServiceAI';
import './AiChat.css';

const AiChat = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState(() => {
    const savedHistory = localStorage.getItem('aiChatHistory');
    try {
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error("Failed to parse chat history from localStorage", e);
      return [];
    }
  });
  const [chatMode, setChatMode] = useState('input'); // 'input' or 'quick'
  const [dietMessages, setDietMessages] = useState({});
  const [plannerMessages, setPlannerMessages] = useState({});
  const [macroInfo, setMacroInfo] = useState({});
  const [plannerInfo, setPlannerInfo] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (conversation.length > 0) {
      try {
        localStorage.setItem('aiChatHistory', JSON.stringify(conversation));
      } catch (e) {
        console.error("Failed to save chat history to localStorage", e);
      }
    }
  }, [conversation]);

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

  // Effect to extract meal planner info when a meal-planner-related message is added
  useEffect(() => {
    const extractPlannerInfo = async () => {
      const plannerRelatedMessages = conversation.filter(msg => msg.role === 'assistant' && msg.isMealPlannerRelated);
      if (plannerRelatedMessages.length === 0) return;
      
      const latestMessage = plannerRelatedMessages[plannerRelatedMessages.length - 1];
      if (!latestMessage.id || !plannerMessages[latestMessage.id]) return;
      
      // If we already have planner info for this message, don't re-extract
      if (plannerInfo[latestMessage.id]) return;
      
      try {
        const { userQuery, aiResponse } = plannerMessages[latestMessage.id];
        const extractedInfo = await extractMealPlannerInfo(userQuery, aiResponse);
        
        if (extractedInfo) {
          setPlannerInfo(prev => ({
            ...prev,
            [latestMessage.id]: extractedInfo
          }));
        }
      } catch (error) {
        console.error('Error extracting meal planner info:', error);
      }
    };
    
    extractPlannerInfo();
  }, [conversation, plannerMessages]);

  // Function to clean up formatting from AI responses
  const cleanupFormatting = (text) => {
    if (!text) return '';
    
    // Remove markdown-style formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting
      .replace(/__(.*?)__/g, '$1')     // Remove underline formatting
      .replace(/~~(.*?)~~/g, '$1')     // Remove strikethrough
      .replace(/```(.*?)```/gs, '$1')  // Remove code blocks
      .replace(/`(.*?)`/g, '$1');      // Remove inline code
  };

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

  // Handler for the "Add to Planner" button
  const handleAddToPlanner = async (messageId) => {
    try {
      const messageInfo = plannerMessages[messageId];
      if (!messageInfo) return;
      
      // Show loading state
      setLoading(true);
      
      const { userQuery, aiResponse } = messageInfo;
      
      // Check if we already have planner info for this message
      let mealSuggestions = plannerInfo[messageId];
      
      // If not, extract it now
      if (!mealSuggestions) {
        mealSuggestions = await extractMealPlannerInfo(userQuery, aiResponse);
        
        if (mealSuggestions) {
          // Cache the extracted data
          setPlannerInfo(prev => ({
            ...prev,
            [messageId]: mealSuggestions
          }));
        }
      }
      
      // Navigate to the MealPlanner page with the meal suggestions
      navigate('/meal-planner', {
        state: {
          source: 'aiChat',
          messageContent: aiResponse,
          userQuery: userQuery,
          mealSuggestions: mealSuggestions
        }
      });
    } catch (error) {
      console.error('Error adding to meal planner:', error);
      setError('Failed to process meal planning information. Please try again.');
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

  // Format meal planner info for display
  const formatMealPlannerInfo = (info) => {
    if (!info || !info.meals || !info.plan_title) return null;
    
    // Function to handle selecting a specific meal
    const handleSelectMeal = (meal) => {
      // Navigate to meal planner with just this specific meal
      navigate('/meal-planner', {
        state: {
          source: 'aiChat',
          messageContent: "Selected individual meal from AI suggestions",
          selectedMeal: meal
        }
      });
    };
    
    return (
      <div className="meal-planner-info">
        <h4>{info.plan_title}</h4>
        <div className="meal-options">
          {info.meals.map((meal, index) => (
            <div key={index} className="meal-option">
              <h5>{meal.meal_name}</h5>
              <div className="macro-badges">
                <span className="macro-badge calorie">{meal.calories} cal</span>
                <span className="macro-badge protein">{meal.protein_g}g protein</span>
                <span className="macro-badge carbs">{meal.carbs_g}g carbs</span>
                <span className="macro-badge fats">{meal.fats_g}g fats</span>
              </div>
              <button 
                className="select-meal-button" 
                onClick={() => handleSelectMeal(meal)}
              >
                Select This Meal
              </button>
            </div>
          ))}
        </div>
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
      
      // Get the normal AI response using the conversation history
      const result = await generateAIResponse(currentPrompt, {
        temperature: 0.7,
        maxTokens: 500,
        conversationHistory: conversation // Pass the full conversation history
      });
      
      if (!result || !result.response) {
        throw new Error("Received empty response from AI service");
      }
      
      console.log("AI response received:", result.response.substring(0, 50) + "...");
      
      // Generate a unique ID for this message pair
      const messageId = Date.now().toString();
      
      // Clean up formatting in the AI response
      const cleanedResponse = cleanupFormatting(result.response);
      
      // Add AI response to conversation with classification info
      const aiMessage = { 
        id: messageId,
        role: 'assistant', 
        content: cleanedResponse,
        isDietRelated: messageType === 'diet',
        isMealPlannerRelated: messageType === 'meal-planner'
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      // If this is a diet-related message, store the context for later use
      if (messageType === 'diet') {
        setDietMessages(prev => ({
          ...prev,
          [messageId]: {
            userQuery: currentPrompt,
            aiResponse: cleanedResponse
          }
        }));
      }
      
      // If this is a meal-planner-related message, store the context for later use
      if (messageType === 'meal-planner') {
        setPlannerMessages(prev => ({
          ...prev,
          [messageId]: {
            userQuery: currentPrompt,
            aiResponse: cleanedResponse
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
      
      // Clean up formatting in the AI response
      const cleanedResponse = cleanupFormatting(result.response);
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: cleanedResponse };
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
      
      // Clean up formatting in the AI response
      const cleanedResponse = cleanupFormatting(result.response);
      
      // Add AI response to conversation
      const aiMessage = { 
        id: messageId,
        role: 'assistant', 
        content: cleanedResponse,
        isDietRelated: true
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      // Store this message for later extraction
      setDietMessages(prev => ({
        ...prev,
        [messageId]: {
          userQuery,
          aiResponse: cleanedResponse
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
      
      // Clean up formatting in the AI response
      const cleanedResponse = cleanupFormatting(result.response);
      
      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: cleanedResponse };
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
      
      // Clear backend conversation history
      const response = await fetch('/api/ai/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear backend conversation history');
      }
      
      // Clear the local conversation state
      setConversation([]);
      // Clear stored diet messages
      setDietMessages({});
      // Clear stored planner messages
      setPlannerMessages({});
      // Clear macro info
      setMacroInfo({});
      // Clear planner info
      setPlannerInfo({});
      
      // Clear localStorage
      localStorage.removeItem('aiChatHistory');
      
      // Show success notification
      setNotification({
        show: true,
        message: 'Chat history cleared successfully',
        type: 'success'
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Error clearing chat:', err);
      setError(err.message || 'Failed to clear chat history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SideBar />
      <div className="ai-chat-container">
        <div className="ai-chat-header">
          <h3 className='ai-chat-title'>AI Health Coach</h3>
          <button 
            onClick={handleClearChat} 
            disabled={loading || conversation.length === 0}
            className="restart-chat-button"
            title="Clear conversation history"
          >
            <span className="restart-icon">↻</span> Restart Chat
          </button>
        </div>
        
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        <div className="chat-conversation">
          {conversation.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              <div className="message-bubble">
                {message.content}
                
                {message.role === 'assistant' && message.isDietRelated && macroInfo[message.id] && (
                  <div className="nutrition-display">
                    <hr />
                    {formatNutritionInfo(macroInfo[message.id])}
                  </div>
                )}
                
                {message.role === 'assistant' && message.isMealPlannerRelated && plannerInfo[message.id] && (
                  <div className="nutrition-display planner-display">
                    <hr />
                    {formatMealPlannerInfo(plannerInfo[message.id])}
                  </div>
                )}
              </div>
              
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
              
              {message.role === 'assistant' && message.isMealPlannerRelated && (
                <div className="message-actions-below">
                  <button 
                    className="add-to-planner-button"
                    onClick={() => handleAddToPlanner(message.id)}
                  >
                    Add to Planner
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="chat-message assistant">
              <div className="message-bubble thinking">
                Thinking...
              </div>
            </div>
          )}
          
          {conversation.length === 0 && !loading && (
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