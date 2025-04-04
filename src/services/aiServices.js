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