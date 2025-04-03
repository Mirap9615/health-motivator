export const generateAIResponse = async (prompt, options = {}) => {
  try {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty');
    }
    
    // Log request
    console.log('Sending AI request:', { promptLength: prompt.length, options });
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, options }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Unknown error occurred';
      console.error('AI service error:', data);
      throw new Error(errorMessage);
    }
    
    // Validate response format
    if (!data.response) {
      console.error('Invalid AI response format:', data);
      throw new Error('Invalid response format from AI service');
    }
    
    return data;
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw error;
  }
};

// Function to clear conversation history
export const clearConversationHistory = async () => {
  try {
    const response = await fetch('/api/ai/clear-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear conversation history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    throw error;
  }
};

// Helper function for generating health tips
export const generateHealthTips = async (userStats) => {
  const prompt = `Based on these health stats: 
    - Steps: ${userStats.steps || 0}
    - Exercise duration: ${userStats.duration_min || 0} minutes
    - Calories burned: ${userStats.calories_burned || 0} 
    - Calories consumed: ${userStats.calories || 0} 
    - Protein consumed: ${userStats.protein_g || 0}g
    - Carbs consumed: ${userStats.carbs_g || 0}g
    - Fats consumed: ${userStats.fats_g || 0}g
    
    Provide [ONLY ONE] brief, personalized health tips to improve fitness and diet. It should be less than 10 WORDS LONG.`;
  
  const options = {
    temperature: 0.7,
    maxTokens: 300
  };
  
  return generateAIResponse(prompt, options);
};

// Helper function for meal suggestions
export const generateMealSuggestion = async (preferences, restrictions = []) => {
  const prompt = `Suggest [ONLY ONE] healthy meal OR snack that is ${preferences.join(', ')}${
    restrictions.length ? ` and does not contain ${restrictions.join(', ')}` : ''
  }. Include calories. IT SHOULD BE LESS THAN 12 WORDS.`;
  
  const options = {
    temperature: 0.8,
    maxTokens: 250
  };
  
  return generateAIResponse(prompt, options);
};

// Helper function for workout suggestions
export const generateWorkoutSuggestion = async (duration, intensity, equipment = []) => {
  const prompt = `Suggest a ${intensity} intensity workout that takes ${duration} minutes${
    equipment.length ? ` using ${equipment.join(', ')}` : ' without equipment'
  }. List [ONLY ONE] brief exercise, sets, reps, and estimated calories burned. It should be body workouts people can simply do at home that usually tkaes around 30-40 minutes of their time. It should be less than 10 WORDS LONG.`;
  
  const options = {
    temperature: 0.7,
    maxTokens: 350
  };
  
  return generateAIResponse(prompt, options);
};