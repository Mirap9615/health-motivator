import { generateAIResponse } from './aiServices';

/**
 * Classify a user prompt as diet-related, meal-planner-related, or other
 * @param {string} userPrompt - The user's message
 * @returns {Promise<string>} - Classification result: "diet", "meal-planner", or "other"
 */
export const classifyUserPrompt = async (userPrompt) => {
  const classificationPrompt = `
  CLASSIFICATION TASK ONLY.
  
  You are a health assistant specialized in nutrition and fitness. Your task is to classify if the user's message is about:
  
  1. Diet (food nutrition, calories, macros like protein, carbs or fats, specific foods, meals, recipes, dietary plans) - respond with EXACTLY "diet"
  
  2. Meal planning (weekly meal plans, meal scheduling, meal prep, organizing meals for specific days) - respond with EXACTLY "meal-planner"
  
  3. Any other topic - respond with EXACTLY "other"
  
  DO NOT respond to the user query directly. Your response must be EXACTLY one word: "diet", "meal-planner", or "other".
  
  User query: "${userPrompt}"
  `;

  try {
    const result = await generateAIResponse(classificationPrompt, {
      temperature: 0.1, // Low temperature for more deterministic responses
      maxTokens: 10 // Very small token limit since we only need one word
    });
    
    if (!result || !result.response) {
      throw new Error('Failed to classify user prompt');
    }
    
    const classification = result.response.trim().toLowerCase();
    
    // Validate the classification
    if (classification === 'diet' || classification === 'meal-planner' || classification === 'other') {
      return classification;
    } else {
      console.warn('Unexpected classification result:', classification);
      return 'other'; // Default to other for unexpected responses
    }
  } catch (error) {
    console.error('Error classifying user prompt:', error);
    return 'other'; // Default to other on error
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

// Function to extract meal plan information from AI response (with 3 meal options)
export const extractMealPlannerInfo = async (userQuery, aiResponse) => {
  try {
    const extractionPrompt = `
      Based on this conversation about meal planning:
      
      User query: "${userQuery}"
      Your response: "${aiResponse}"
      
      Extract THREE different meal options mentioned or implied in the conversation.
      For each meal, provide estimated nutritional information.
      
      Return ONLY a JSON object with this structure:
      {
        "plan_title": "Brief title for this meal plan",
        "meals": [
          {
            "meal_name": "First meal name",
            "calories": estimated calories (number only),
            "protein_g": estimated protein in grams (number only),
            "carbs_g": estimated carbs in grams (number only),
            "fats_g": estimated fats in grams (number only)
          },
          {
            "meal_name": "Second meal name",
            "calories": estimated calories (number only),
            "protein_g": estimated protein in grams (number only),
            "carbs_g": estimated carbs in grams (number only),
            "fats_g": estimated fats in grams (number only)
          },
          {
            "meal_name": "Third meal name",
            "calories": estimated calories (number only),
            "protein_g": estimated protein in grams (number only),
            "carbs_g": estimated carbs in grams (number only),
            "fats_g": estimated fats in grams (number only)
          }
        ]
      }
      
      If THREE meals aren't directly mentioned, suggest appropriate ones that would fit with the meal plan discussion.
      Be accurate with your nutritional estimates based on standard nutritional values.
      Return ONLY the JSON with no other text.
    `;
    
    const result = await generateAIResponse(extractionPrompt, {
      temperature: 0.3,
      maxTokens: 600 // Increased token limit for 3 meal options
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
    console.error('Error extracting meal planner info:', error);
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