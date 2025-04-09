import React, { useState, useEffect } from 'react';
import ReactSpeedometer from "react-d3-speedometer";
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

function DashboardHealthScore() {
  const [score, setScore] = useState(45);
  const [dietData, setDietData] = useState([]);
  const [scoreBreakdown, setScoreBreakdown] = useState({
    calories: { score: 0, message: "" },
    protein: { score: 0, message: "" },
    carbs: { score: 0, message: "" },
    fats: { score: 0, message: "" },
    consistency: { score: 0, message: "" }
  });
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const navigate = useNavigate();

  // Reference values based on general guidelines
  // These should be personalized based on age, weight, gender, activity level
  const REFERENCE = {
    // Default reference values, should be customized per user
    calories: {
      min: 1800, // Minimum healthy daily calories
      max: 2500, // Maximum healthy daily calories
      weight: 0.3 // 30% of total score
    },
    protein: {
      min: 50, // Minimum grams per day
      ideal: 0.8, // 0.8g per kg of body weight
      max: 2.0, // Maximum grams per kg body weight
      weight: 0.25 // 25% of total score
    },
    carbs: {
      min: 130, // Minimum grams per day
      idealPercent: 0.5, // 50% of daily calories
      maxPercent: 0.65, // 65% of daily calories
      weight: 0.2 // 20% of total score
    },
    fats: {
      minPercent: 0.2, // Minimum 20% of daily calories
      idealPercent: 0.3, // Ideal 30% of daily calories
      maxPercent: 0.35, // Maximum 35% of daily calories
      weight: 0.15 // 15% of total score
    },
    consistency: {
      weight: 0.1 // 10% of total score
    }
  };

  const userMetrics = {
    weight: 70, // kg, should be fetched from user profile
    height: 175, // cm, should be fetched from user profile
    age: 30, // years, should be fetched from user profile
    gender: 'male', // should be fetched from user profile
    activityLevel: 'moderate' // should be fetched from user profile
  };

  useEffect(() => {
    // Fetch diet data
    fetchDietData();
  }, []);

  const fetchDietData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/entries/diet/past", { 
        method: "GET", 
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setDietData(data);
        calculateHealthScore(data);
      } else {
        console.error("Failed to fetch diet data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching diet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (data) => {
    if (!data || data.length === 0) {
      setScore(0);
      return;
    }

    // Get data from the last 7 days
    const now = new Date();
    const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentData = data.filter(entry => {
      const entryDate = new Date(entry.entry_time);
      return entryDate >= past7Days && entryDate <= now;
    });

    if (recentData.length === 0) {
      setScore(0);
      return;
    }

    // Group data by day
    const dailyData = {};
    
    recentData.forEach(entry => {
      const dateKey = moment(entry.entry_time).format('YYYY-MM-DD');
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fats_g: 0,
          entries: 0
        };
      }
      
      dailyData[dateKey].calories += Number(entry.calories) || 0;
      dailyData[dateKey].protein_g += Number(entry.protein_g) || 0;
      dailyData[dateKey].carbs_g += Number(entry.carbs_g) || 0;
      dailyData[dateKey].fats_g += Number(entry.fats_g) || 0;
      dailyData[dateKey].entries += 1;
    });

    const dayCount = Object.keys(dailyData).length;
    
    // Calculate average daily values
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    Object.values(dailyData).forEach(day => {
      totalCalories += day.calories;
      totalProtein += day.protein_g;
      totalCarbs += day.carbs_g;
      totalFats += day.fats_g;
    });
    
    const avgCalories = totalCalories / dayCount;
    const avgProtein = totalProtein / dayCount;
    const avgCarbs = totalCarbs / dayCount;
    const avgFats = totalFats / dayCount;

    // Calculate score for each component
    
    // 1. Calorie score - based on how close to recommended range
    const calorieScore = calculateCalorieScore(avgCalories);
    
    // 2. Protein score - based on protein per kg of body weight
    const proteinScore = calculateProteinScore(avgProtein);
    
    // 3. Carbs score - based on percentage of total calories
    const carbsScore = calculateCarbsScore(avgCarbs, avgCalories);
    
    // 4. Fats score - based on percentage of total calories
    const fatsScore = calculateFatsScore(avgFats, avgCalories);
    
    // 5. Consistency score - based on having data for multiple days
    const consistencyScore = calculateConsistencyScore(dayCount);

    // Calculate weighted total score
    const totalScore = Math.round(
      calorieScore.score * REFERENCE.calories.weight +
      proteinScore.score * REFERENCE.protein.weight +
      carbsScore.score * REFERENCE.carbs.weight +
      fatsScore.score * REFERENCE.fats.weight +
      consistencyScore.score * REFERENCE.consistency.weight
    );

    // Update state with the calculated score and breakdown
    setScore(totalScore);
    setScoreBreakdown({
      calories: calorieScore,
      protein: proteinScore,
      carbs: carbsScore,
      fats: fatsScore,
      consistency: consistencyScore
    });
  };

  const calculateCalorieScore = (avgCalories) => {
    const { min, max } = REFERENCE.calories;
    let score = 0;
    let message = "";

    if (avgCalories < min * 0.5) {
      // Severely under recommended
      score = 20;
      message = "Calorie intake is very low. Consider increasing your daily calories.";
    } else if (avgCalories < min) {
      // Under recommended
      const deficit = min - avgCalories;
      const deficitPercent = deficit / min;
      score = 60 - (deficitPercent * 40);
      message = "Calorie intake is below recommended. Consider a slight increase.";
    } else if (avgCalories <= max) {
      // Within recommended range - perfect score
      const rangeSize = max - min;
      const positionInRange = avgCalories - min;
      const percentageInRange = positionInRange / rangeSize;
      
      // Higher score when closer to middle of range
      score = 90 + (10 * (1 - Math.abs(percentageInRange - 0.5) * 2));
      message = "Calorie intake is within the healthy range. Good job!";
    } else if (avgCalories <= max * 1.5) {
      // Above recommended
      const excess = avgCalories - max;
      const excessPercent = excess / max;
      score = 60 - (excessPercent * 40);
      message = "Calorie intake is above recommended. Consider a slight reduction.";
    } else {
      // Severely above recommended
      score = 20;
      message = "Calorie intake is very high. Consider reducing your daily calories.";
    }

    return { score, message };
  };

  const calculateProteinScore = (avgProtein) => {
    const { min, ideal, max } = REFERENCE.protein;
    const idealProtein = userMetrics.weight * ideal;
    const maxProtein = userMetrics.weight * max;
    let score = 0;
    let message = "";

    if (avgProtein < min) {
      // Below minimum
      const deficitPercent = (min - avgProtein) / min;
      score = 60 - (deficitPercent * 60);
      message = "Protein intake is below recommended levels. Consider adding more protein to your diet.";
    } else if (avgProtein < idealProtein) {
      // Between minimum and ideal
      const range = idealProtein - min;
      const position = avgProtein - min;
      score = 60 + (position / range) * 40;
      message = "Protein intake is adequate but could be improved for optimal health.";
    } else if (avgProtein <= maxProtein) {
      // Between ideal and maximum - optimal range
      score = 100;
      message = "Protein intake is optimal for your body weight. Great job!";
    } else {
      // Above maximum
      const excessPercent = Math.min((avgProtein - maxProtein) / maxProtein, 1);
      score = 100 - (excessPercent * 50);
      message = "Protein intake may be higher than necessary. Consider balancing your macronutrients.";
    }

    return { score, message };
  };

  const calculateCarbsScore = (avgCarbs, avgCalories) => {
    const { min, idealPercent, maxPercent } = REFERENCE.carbs;
    // Convert carbs to calories (4 calories per gram)
    const carbCalories = avgCarbs * 4;
    const carbPercent = carbCalories / avgCalories;
    let score = 0;
    let message = "";

    if (avgCarbs < min) {
      // Below minimum
      const deficitPercent = (min - avgCarbs) / min;
      score = 60 - (deficitPercent * 60);
      message = "Carbohydrate intake is below recommended minimum. Consider adding more complex carbs.";
    } else if (carbPercent < idealPercent) {
      // Below ideal percentage
      const range = idealPercent - (min * 4 / avgCalories);
      const position = carbPercent - (min * 4 / avgCalories);
      score = 60 + (position / range) * 40;
      message = "Carbohydrate intake is adequate but could be increased slightly for optimal energy.";
    } else if (carbPercent <= maxPercent) {
      // Within ideal range
      score = 100;
      message = "Carbohydrate intake is in the optimal range. Well done!";
    } else {
      // Above maximum percentage
      const excessPercent = Math.min((carbPercent - maxPercent) / maxPercent, 1);
      score = 100 - (excessPercent * 50);
      message = "Carbohydrate intake may be higher than ideal. Consider reducing simple carbs.";
    }

    return { score, message };
  };

  const calculateFatsScore = (avgFats, avgCalories) => {
    const { minPercent, idealPercent, maxPercent } = REFERENCE.fats;
    // Convert fats to calories (9 calories per gram)
    const fatCalories = avgFats * 9;
    const fatPercent = fatCalories / avgCalories;
    let score = 0;
    let message = "";

    if (fatPercent < minPercent) {
      // Below minimum
      const deficitPercent = (minPercent - fatPercent) / minPercent;
      score = 60 - (deficitPercent * 60);
      message = "Fat intake is below recommended levels. Consider adding healthy fats to your diet.";
    } else if (fatPercent < idealPercent) {
      // Below ideal percentage
      const range = idealPercent - minPercent;
      const position = fatPercent - minPercent;
      score = 60 + (position / range) * 40;
      message = "Fat intake is adequate but could be optimized for better nutrient absorption.";
    } else if (fatPercent <= maxPercent) {
      // Within ideal range
      score = 100;
      message = "Fat intake is in the optimal range. Excellent balance!";
    } else {
      // Above maximum percentage
      const excessPercent = Math.min((fatPercent - maxPercent) / maxPercent, 1);
      score = 100 - (excessPercent * 50);
      message = "Fat intake may be higher than ideal. Consider reducing saturated fats.";
    }

    return { score, message };
  };

  const calculateConsistencyScore = (dayCount) => {
    let score = 0;
    let message = "";

    if (dayCount <= 1) {
      score = 0;
      message = "We need more days of data to accurately assess your consistency.";
    } else if (dayCount <= 3) {
      score = dayCount * 25;
      message = "You're building consistency in tracking your diet. Keep it up!";
    } else if (dayCount < 7) {
      score = 75 + ((dayCount - 3) * 8.33);
      message = "Good consistency in diet tracking. A full week will give the best results.";
    } else {
      score = 100;
      message = "Excellent consistency! You've logged a full week of diet data.";
    }

    return { score, message };
  };

  // Display a message about the score
  const getScoreMessage = () => {
    if (score >= 90) {
      return "Excellent! Your diet is very well balanced.";
    } else if (score >= 75) {
      return "Great job! Your diet is well balanced with minor improvements possible.";
    } else if (score >= 60) {
      return "Good. Your diet is generally balanced but has room for improvement.";
    } else if (score >= 40) {
      return "Fair. Your diet could benefit from some adjustments.";
    } else {
      return "Your diet needs attention to improve nutritional balance.";
    }
  };

  // Toggle the score breakdown visibility
  const toggleBreakdown = () => {
    setShowBreakdown(prev => !prev);
  };

  // Navigate to AI Coach page
  const goToAiCoach = () => {
    navigate('/ai-chat');
  };

  return (
    <div className="text-center">
      <h2 className="mb-4">Your Diet Health Score</h2>
      
      {/* Fixed position gauge container */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto', position: 'relative' }}>
        <div style={{ width: '300px', height: '200px', position: 'relative' }}>
          <ReactSpeedometer
            width={300}
            height={200}
            value={score}
            minValue={0}
            maxValue={100}
            segments={5}
            currentValueText={`${score}/100`}
            customSegmentLabels={[
              {
                text: "Poor",
                position: "INSIDE",
                color: "#555",
              },
              {
                text: "Fair",
                position: "INSIDE",
                color: "#555",
              },
              {
                text: "Good",
                position: "INSIDE",
                color: "#555",
              },
              {
                text: "Great",
                position: "INSIDE",
                color: "#555",
              },
              {
                text: "Excellent",
                position: "INSIDE",
                color: "#555",
              },
            ]}
            segmentColors={["#FF4B4B", "#FFA500", "#FFDD00", "#90EE90", "#00FF00"]}
            needleColor="#333"
            textColor="#333"
          />
        </div>
      </div>
      
      <p className="mt-2 mb-3 text-gray-600">{getScoreMessage()}</p>
      
      <div style={{ marginBottom: '15px' }}>
        {showBreakdown ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              onClick={toggleBreakdown}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Hide Score Breakdown▲
            </button>
            <button 
              onClick={goToAiCoach}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Consult AI Coach
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              onClick={toggleBreakdown}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Show Score Breakdown▼
            </button>
            <button 
              onClick={goToAiCoach}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Consult AI Coach
            </button>
          </div>
        )}
      </div>
      
      {/* Non-collapsible breakdown section */}
      {showBreakdown && (
        <div style={{
          textAlign: 'left',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          marginBottom: '10px'
        }}>
          <div><strong>Score Breakdown:</strong></div>
          <div><strong>Calories:</strong> {scoreBreakdown.calories.message}</div>
          <div><strong>Protein:</strong> {scoreBreakdown.protein.message}</div>
          <div><strong>Carbohydrates:</strong> {scoreBreakdown.carbs.message}</div>
          <div><strong>Fats:</strong> {scoreBreakdown.fats.message}</div>
          <div><strong>Consistency:</strong> {scoreBreakdown.consistency.message}</div>
        </div>
      )}
    </div>
  );
}

export default DashboardHealthScore; 