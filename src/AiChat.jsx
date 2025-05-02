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

  useEffect(() => {
    const extractDietInfo = async () => {
      const dietRelatedMessages = conversation.filter(msg => msg.role === 'assistant' && msg.isDietRelated);
      if (dietRelatedMessages.length === 0) return;
      
      const latestMessage = dietRelatedMessages[dietRelatedMessages.length - 1];
      if (!latestMessage.id || !dietMessages[latestMessage.id]) return;
      
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

  useEffect(() => {
    const extractPlannerInfo = async () => {
      const plannerRelatedMessages = conversation.filter(msg => msg.role === 'assistant' && msg.isMealPlannerRelated);
      if (plannerRelatedMessages.length === 0) return;
      
      const latestMessage = plannerRelatedMessages[plannerRelatedMessages.length - 1];
      if (!latestMessage.id || !plannerMessages[latestMessage.id]) return;
      
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

  const cleanupFormatting = (text) => {
    if (!text) return '';
    
    return text // remove all sorts of formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') 
      .replace(/\*(.*?)\*/g, '$1')    
      .replace(/__(.*?)__/g, '$1')     
      .replace(/~~(.*?)~~/g, '$1')     
      .replace(/```(.*?)```/gs, '$1') 
      .replace(/`(.*?)`/g, '$1');      
  };

  const handleAddToDiet = async (messageId) => {
    try {
      const messageInfo = dietMessages[messageId];
      if (!messageInfo) return;
      
      setLoading(true);
      
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

  const handleAddToPlanner = async (messageId) => {
    try {
      const messageInfo = plannerMessages[messageId];
      if (!messageInfo) return;
      
      setLoading(true);
      
      const { userQuery, aiResponse } = messageInfo;
      
      let mealSuggestions = plannerInfo[messageId];
      
      if (!mealSuggestions) {
        mealSuggestions = await extractMealPlannerInfo(userQuery, aiResponse);
        
        if (mealSuggestions) {
          setPlannerInfo(prev => ({
            ...prev,
            [messageId]: mealSuggestions
          }));
        }
      }
      
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

  const formatNutritionInfo = (info) => {
    // Validate that we have complete nutrition information before displaying
    if (!info || !info.meal_name || 
        typeof info.calories === 'undefined' || 
        typeof info.protein_g === 'undefined' || 
        typeof info.carbs_g === 'undefined' || 
        typeof info.fats_g === 'undefined') {
      
      return (
        <div className="nutrition-info error">
          <p>Could not display complete nutrition information. Try asking about a specific meal.</p>
        </div>
      );
    }
    
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

  const formatMealPlannerInfo = (info) => {
    // Validate that we have complete meal planner information
    if (!info || !info.plan_title || !Array.isArray(info.meals) || info.meals.length === 0) {
      return (
        <div className="meal-planner-info error">
          <p>Could not display complete meal plan information. Try asking about meal planning.</p>
        </div>
      );
    }
    
    const handleSelectMeal = (meal) => {
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
          {info.meals.map((meal, index) => {
            // Skip meals with missing data
            if (!meal || !meal.meal_name || 
                typeof meal.calories === 'undefined' || 
                typeof meal.protein_g === 'undefined' || 
                typeof meal.carbs_g === 'undefined' || 
                typeof meal.fats_g === 'undefined') {
              return null;
            }
            
            return (
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
            );
          })}
        </div>
      </div>
    );
  };

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const userMessage = { role: 'user', content: prompt };
      setConversation(prev => [...prev, userMessage]);
      
      const currentPrompt = prompt;
      setPrompt(''); 
      
      const messageType = await classifyUserPrompt(currentPrompt);
      console.log("Classification result:", messageType);
      
      const result = await generateAIResponse(currentPrompt, {
        temperature: 0.7,
        maxTokens: 500,
        conversationHistory: conversation 
      });
      
      if (!result || !result.response) {
        throw new Error("Received empty response from AI service");
      }
      
      console.log("AI response received:", result.response.substring(0, 50) + "...");
      
      const messageId = Date.now().toString();
      
      const cleanedResponse = cleanupFormatting(result.response);
      
      const aiMessage = { 
        id: messageId,
        role: 'assistant', 
        content: cleanedResponse,
        isDietRelated: messageType === 'diet',
        isMealPlannerRelated: messageType === 'meal-planner'
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      // Immediately process diet-related messages
      if (messageType === 'diet') {
        setDietMessages(prev => ({
          ...prev,
          [messageId]: {
            userQuery: currentPrompt,
            aiResponse: cleanedResponse
          }
        }));
        
        // Immediately extract and set macro information
        try {
          const extractedInfo = await extractMacroInfo(currentPrompt, cleanedResponse);
          if (extractedInfo) {
            setMacroInfo(prev => ({
              ...prev,
              [messageId]: extractedInfo
            }));
          }
        } catch (extractError) {
          console.error('Error extracting diet info:', extractError);
        }
      }
      
      // Immediately process meal-planner-related messages
      if (messageType === 'meal-planner') {
        setPlannerMessages(prev => ({
          ...prev,
          [messageId]: {
            userQuery: currentPrompt,
            aiResponse: cleanedResponse
          }
        }));
        
        // Immediately extract and set meal planner information
        try {
          const extractedInfo = await extractMealPlannerInfo(currentPrompt, cleanedResponse);
          if (extractedInfo) {
            setPlannerInfo(prev => ({
              ...prev,
              [messageId]: extractedInfo
            }));
          }
        } catch (extractError) {
          console.error('Error extracting meal planner info:', extractError);
        }
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setError(err.message || "Failed to get response from AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      const userMessage = { role: 'user', content: 'Give me a health tip based on my activity data.' };
      setConversation(prev => [...prev, userMessage]);
      
      const healthTipsPrompt = generateHealthTipsPrompt(mockUserStats);
      const result = await generateAIResponse(healthTipsPrompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      
      const cleanedResponse = cleanupFormatting(result.response);
      
      const aiMessage = { role: 'assistant', content: cleanedResponse };
      setConversation(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get health tips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMealSuggestion = async () => {
    setLoading(true);
    setError('');
    
    try {
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
      
      const messageId = Date.now().toString();
      
      const cleanedResponse = cleanupFormatting(result.response);
      
      const aiMessage = { 
        id: messageId,
        role: 'assistant', 
        content: cleanedResponse,
        isDietRelated: true
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      setDietMessages(prev => ({
        ...prev,
        [messageId]: {
          userQuery,
          aiResponse: cleanedResponse
        }
      }));
      
      // Immediately extract and set macro information
      try {
        const extractedInfo = await extractMacroInfo(userQuery, cleanedResponse);
        if (extractedInfo) {
          setMacroInfo(prev => ({
            ...prev,
            [messageId]: extractedInfo
          }));
        }
      } catch (extractError) {
        console.error('Error extracting diet info from quick suggestion:', extractError);
      }
    } catch (err) {
      setError(err.message || "Failed to get meal suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutSuggestion = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userMessage = { role: 'user', content: 'Suggest a 30-minute home workout routine.' };
      setConversation(prev => [...prev, userMessage]);
      
      const workoutPrompt = generateWorkoutPrompt("30", "moderate");
      const result = await generateAIResponse(workoutPrompt, {
        temperature: 0.7,
        maxTokens: 1000
      });
      
      const cleanedResponse = cleanupFormatting(result.response);
      
      const aiMessage = { role: 'assistant', content: cleanedResponse };
      setConversation(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get workout suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      setLoading(true);
      
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
      
      setConversation([]);
      setDietMessages({});
      setPlannerMessages({});
      setMacroInfo({});
      setPlannerInfo({});
      
      localStorage.removeItem('aiChatHistory');
      
      setNotification({
        show: true,
        message: 'Chat history cleared successfully',
        type: 'success'
      });
      
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
              
              {message.role === 'assistant' && message.isDietRelated && macroInfo[message.id] && (
                <div className="message-actions-below">
                  <button 
                    className="add-to-diet-button"
                    onClick={() => handleAddToDiet(message.id)}
                  >
                    Add to Diet
                  </button>
                </div>
              )}
              
              {message.role === 'assistant' && message.isMealPlannerRelated && plannerInfo[message.id] && (
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