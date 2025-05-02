import { generateAIResponse } from './aiServices';

const SIMPLE_STYLE_INSTRUCTION = "Use simple sentences. Avoid complex formatting like nested lists or excessive symbols/parentheses unless necessary for clarity (like in workout steps).";
const TITLE_SEPARATOR = "|||";


export const classifyUserPrompt = async (userPrompt) => {
    const classificationPrompt = `CLASSIFICATION TASK ONLY. Classify the user query into one of these categories:
1. "diet" - if query is about a specific meal, food item, nutritional information, or adding food to diet tracking
2. "meal-planner" - if query is about meal planning, meal schedules, or creating a meal plan for multiple days
3. "other" - if query is not about meals, food, nutrition, or diet

Respond with ONLY ONE WORD: "diet", "meal-planner", or "other".
User query: "${userPrompt}"`;

    try {
        const result = await generateAIResponse(classificationPrompt, { temperature: 0.1, maxTokens: 10 });
        if (!result?.response) throw new Error('Failed to classify');
        const classification = result.response.trim().toLowerCase();
        if (['diet', 'meal-planner', 'other'].includes(classification)) return classification;
        console.warn('Unexpected classification result:', classification);
        return 'other';
    } catch (error) {
        console.error('Error classifying user prompt:', error);
        return 'other';
    }
};

export const extractMacroInfo = async (userQuery, aiResponse) => {
    const extractionPrompt = `Based on this conversation about food/nutrition:
User query: "${userQuery}"
Your response: "${aiResponse}"

I need you to ONLY extract or estimate the nutritional information for the meal mentioned in this conversation.
If multiple meals are mentioned, focus on the MAIN meal.

RESPOND ONLY WITH THE FOLLOWING JSON FORMAT AND NOTHING ELSE:
{
  "meal_name": "Name of the specific meal",
  "calories": 500,
  "protein_g": 30,
  "carbs_g": 50,
  "fats_g": 20
}

Replace the example values with reasonable estimates based on the meal. 
Use numbers not strings for numeric values.
If you cannot extract exact values, make your best estimate based on similar foods.
DO NOT include any explanations, markdown formatting, or any text before or after the JSON.`;

    try {
        const result = await generateAIResponse(extractionPrompt, { 
            temperature: 0.3, 
            maxTokens: 250,
            forceJSON: true
        });
        
        if (!result?.response) return null;
        
        // Clean up any potential formatting that might interfere with JSON parsing
        const cleanResponse = result.response
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        
        try {
            // Try to parse the entire response as JSON first
            return JSON.parse(cleanResponse);
        } catch (directParseError) {
            // If that fails, try to extract JSON object using regex
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.error("Failed to parse macro JSON:", parseError);
                    return null;
                }
            }
            return null;
        }
    } catch (error) {
        console.error('Error extracting macro info:', error);
        return null;
    }
};

export const extractMealPlannerInfo = async (userQuery, aiResponse) => {
     const extractionPrompt = `Based on this conversation about meal planning:
User query: "${userQuery}"
Your response: "${aiResponse}"

I need you to extract or estimate nutritional information for UP TO THREE meal options mentioned in this conversation.

RESPOND ONLY WITH THE FOLLOWING JSON FORMAT AND NOTHING ELSE:
{
  "plan_title": "Brief title describing the meal plan",
  "meals": [
    {
      "meal_name": "Name of meal 1",
      "calories": 500,
      "protein_g": 30,
      "carbs_g": 50,
      "fats_g": 20
    },
    {
      "meal_name": "Name of meal 2",
      "calories": 450,
      "protein_g": 25,
      "carbs_g": 45,
      "fats_g": 15
    }
  ]
}

Replace the example values with reasonable estimates based on the meals mentioned.
Use numbers not strings for numeric values.
If you cannot extract exact values, make your best estimate based on similar foods.
DO NOT include any explanations, markdown formatting, or any text before or after the JSON.`;

    try {
        const result = await generateAIResponse(extractionPrompt, { 
            temperature: 0.3, 
            maxTokens: 600,
            forceJSON: true
        });
        
        if (!result?.response) return null;
        
        // Clean up any potential formatting that might interfere with JSON parsing
        const cleanResponse = result.response
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        
        try {
            // Try to parse the entire response as JSON first
            return JSON.parse(cleanResponse);
        } catch (directParseError) {
            // If that fails, try to extract JSON object using regex
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.error("Failed to parse meal planner JSON:", parseError);
                    return null;
                }
            }
            return null;
        }
    } catch (error) {
        console.error('Error extracting meal planner info:', error);
        return null;
    }
};

export const generateWorkoutPrompt = (
    duration = 30, intensity = "moderate", period = "daily", userProfile = null, context = "workout suggestion"
) => {
  let request = "";
  let personalization = "";
  let durationText = "";
  const titleContext = period === 'daily' ? `Today's ${intensity} Workout` : `Weekly ${intensity} Plan`;

  if (period === 'daily') {
      request = `Suggest a specific ${intensity} intensity workout session for today, approx ${duration} minutes.`;
      durationText = `${duration} minutes`;
  } else {
      request = `Suggest a balanced weekly workout schedule/plan, aiming for ~${duration} total minutes of ${intensity} activity. Include exercise variety.`;
      durationText = `total ${duration} minutes weekly`;
  }
  if (userProfile) { 
        personalization += ` Tailor it for someone aged ${userProfile.age || 'an adult'}, activity level "${userProfile.activity_level || 'moderate'}".`;
  }
  if (context.includes("alternative")) { request = `Suggest an ALTERNATIVE to a previous workout. ${request}`; }

  return `Provide a short title (5-10 words) for this ${context}. Then, on a new line using the separator "${TITLE_SEPARATOR}", provide the detailed workout description. ${request}${personalization} Include exercises, structure (sets/reps/time), and a rough calorie estimate for the ${durationText}. ${SIMPLE_STYLE_INSTRUCTION}`;
};

export const generateHealthTipsPrompt = (
    userProfile = null, period = "daily", userGoals = null, context = "health tip"
) => {
  let request = "";
  let personalization = "";
  const titleContext = period === 'daily' ? `Daily Health Tip` : `Weekly Health Strategy`;

  if (period === 'daily') { request = `Provide ONE brief, actionable health tip suitable for today.`; }
  else { request = `Provide ONE broader health strategy or habit focus for this week.`; }

  if (userProfile) { 
        personalization = ` Personalize for age ${userProfile.age || 'N/A'}, activity level "${userProfile.activity_level || 'N/A'}"`;
        if (userProfile.weight_kg && userProfile.height_cm) { const bmi = (userProfile.weight_kg / ((userProfile.height_cm / 100) ** 2)).toFixed(1); personalization += `, approx BMI ${bmi}`; } personalization += ".";
  }
  if (userGoals) { 
        personalization += ` Goals: ~${userGoals.target_daily_steps || 'N/A'} steps/day, ${userGoals.target_sleep_hours || 'N/A'} hrs sleep, ${userGoals.target_water_intake || 'N/A'} glasses water, target ${userGoals.target_calorie_intake || 'N/A'} kcal/day.`;
  }
  if (context.includes("different") || context.includes("alternative")) { request = `Provide ONE DIFFERENT ${period === 'daily' ? 'tip' : 'strategy'}. ${request}`; }

  return `Provide a short title (5-10 words) for this ${context}. Then, on a new line using the separator "${TITLE_SEPARATOR}", provide the detailed tip/strategy explanation. ${request}${personalization} Keep the explanation concise (1-3 simple sentences). ${SIMPLE_STYLE_INSTRUCTION}`;
};

export const generateMealPrompt = (
    preferences = ['healthy'], userProfile = null, userGoals = null, period = "daily", restrictions = []
) => {
  let request = "";
  let personalization = "";
  const titleContext = period === 'daily' ? `Today's Meal/Snack Idea` : `Weekly Meal Ideas`;
  const numSuggestions = period === 'daily' ? 1 : 2; 

  if (period === 'daily') { request = `Suggest ONE healthy meal OR snack for today based on preferences: ${preferences.join(', ')}.`; }
  else { request = `Suggest ${numSuggestions} different healthy meal ideas suitable for planning this week, matching preferences: ${preferences.join(', ')}.`; }

  if (userProfile?.activity_level) { 
        personalization += ` Consider activity level: "${userProfile.activity_level}".`;
  }
  if (userGoals?.target_calorie_intake) { 
       if (period === 'daily') { const targetMealCalories = Math.round(userGoals.target_calorie_intake / (preferences.includes('snack') ? 6 : 3.5)); personalization += ` Aim for ~${targetMealCalories} kcal.`; }
       else { personalization += ` User target is ~${userGoals.target_calorie_intake} kcal/day.`; }
  }
  if (restrictions.length) { personalization += ` Avoid: ${restrictions.join(', ')}.`; }
   if (preferences.includes('different')) { request = `Suggest ONE DIFFERENT healthy meal or snack (for ${period}) based on preferences: ${preferences.filter(p => p !== 'different').join(', ')}.`; }

  return `Provide a short title (5-10 words) summarizing the suggestion(s). Then, on a new line using the separator "${TITLE_SEPARATOR}", provide the detailed meal description(s). ${request}${personalization} Include estimated calorie count(s). Keep descriptions brief. ${SIMPLE_STYLE_INSTRUCTION}`;
};