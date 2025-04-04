import { generateAIResponse } from './aiServices';

// Function to check if the user is asking about food macros
export const classifyUserPrompt = async (userPrompt) => {
  try {
    const classificationPrompt = `
      CLASSIFICATION TASK ONLY:
      Analyze the following user query and determine if they're asking about food macros, nutrition information, 
      or adding something to their diet. Answer ONLY with the word "diet" if the query is about food calories, 
      macronutrients (fats, carbs, protein), or logging food. Otherwise, answer ONLY with the word "other".
      
      Do not respond to the user's query directly - this is only a classification task.
      Your response must be exactly ONE word: either "diet" or "other".
      
      User query: "${userPrompt}"
    `;
    
    const result = await generateAIResponse(classificationPrompt, {
      temperature: 0.1,
      maxTokens: 10
    });
    
    const classification = result.response.trim().toLowerCase();
    return classification.includes('diet') ? 'diet' : 'other';
  } catch (error) {
    console.error('Error classifying prompt:', error);
    return 'other'; // Default to "other" if there's an error
  }
};

// Function to extract macro information from AI response
export const extractMacroInfo = async (userQuery, aiResponse) => {
  try {
    const extractionPrompt = `
      Based on this conversation about food:
      
      User query: "${userQuery}"
      Your response: "${aiResponse}"
      
      Extract the nutritional information and provide ONLY a JSON object with these fields:
      {
        "meal_name": "name of the food/meal",
        "calories": estimated calories (number only),
        "protein_g": estimated protein in grams (number only),
        "carbs_g": estimated carbs in grams (number only),
        "fats_g": estimated fats in grams (number only)
      }
      
      Be accurate with your nutritional estimates. Research standard nutritional values for the foods mentioned.
      For multiple food items, calculate the total nutritional value that MATCHES THE JSON OBJECT for the nutritional information.
      Return ONLY the JSON with no other text.
    `;
    
    const result = await generateAIResponse(extractionPrompt, {
      temperature: 0.3,
      maxTokens: 200
    });
    
    // Extract JSON from the response
    const jsonStart = result.response.indexOf('{');
    const jsonEnd = result.response.lastIndexOf('}') + 1;
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonString = result.response.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting macro info:', error);
    return null;
  }
};

// Generate workout suggestion prompt
export const generateWorkoutPrompt = (duration = "30", intensity = "moderate") => {
  return `Suggest a ${intensity} intensity workout that takes ${duration} minutes without equipment. 
  Make it brief and structured with exercises, sets, reps, and estimated calories burned. IT SHOULD BE LESS THAN 12 WORDS. AND THE RESPONSE SHOULD ONLY CONTAIN NUMBERS OR WORDS.`;
};

// Generate health tips prompt
export const generateHealthTipsPrompt = (userStats) => {
  return `Based on these health stats: 
    - Steps: ${userStats.steps || 0}
    - Exercise duration: ${userStats.duration_min || 0} minutes
    - Calories burned: ${userStats.calories_burned || 0} 
    - Calories consumed: ${userStats.calories || 0} 
    - Protein consumed: ${userStats.protein_g || 0}g
    - Carbs consumed: ${userStats.carbs_g || 0}g
    - Fats consumed: ${userStats.fats_g || 0}g
    
    Provide [ONLY ONE] brief, personalized health tips to improve fitness and diet. It should be less than 10 WORDS LONG.`;
};

// Generate meal suggestion prompt
export const generateMealPrompt = (preferences, restrictions = []) => {
  return `Suggest [ONLY ONE] healthy meal OR snack that is ${preferences.join(', ')}${
    restrictions.length ? ` and does not contain ${restrictions.join(', ')}` : ''
  }. Include calories. IT SHOULD BE LESS THAN 12 WORDS.`;
}; 