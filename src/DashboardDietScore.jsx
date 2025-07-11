import React, { useState, useEffect, useRef } from 'react';
import ReactSpeedometer from "react-d3-speedometer";
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner'; 

function DietScore() {
  const [score, setScore] = useState(45);
  const [dietData, setDietData] = useState([]);
  const [userMetrics, setUserMetrics] = useState({});
  const [scoreBreakdown, setScoreBreakdown] = useState({
    calories: { score: 0, message: "" },
    protein: { score: 0, message: "" },
    carbs: { score: 0, message: "" },
    fats: { score: 0, message: "" },
    consistency: { score: 0, message: "" }
  });
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  // Reference values, dynamicize later
  const REFERENCE = {
    calories: { min: 1800, max: 2500, weight: 0.3 },
    protein: { min: 50, ideal: 0.8, max: 2.0, weight: 0.25 }, // ideal/max are per kg
    carbs: { min: 130, idealPercent: 0.5, maxPercent: 0.65, weight: 0.2 },
    fats: { minPercent: 0.2, idealPercent: 0.3, maxPercent: 0.35, weight: 0.15 },
    consistency: { weight: 0.1 }
  };

  useEffect(() => {
    fetchDietData();
    fetchUserData();
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
      } else {
        console.error("Failed to fetch diet data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching diet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setUserMetrics(data);
        console.log(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error) 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dietData.length > 0 && userMetrics.weight_kg) {
      calculateHealthScore(dietData);
    }
  }, [dietData, userMetrics]);

  const calculateHealthScore = (data) => {
    if (!data || data.length === 0) {
      setScore(0);
      return;
    }

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

    // Score calculation based on all components 
    const calorieScore = calculateCalorieScore(avgCalories);
    const proteinScore = calculateProteinScore(avgProtein);
    const carbsScore = calculateCarbsScore(avgCarbs, avgCalories);
    const fatsScore = calculateFatsScore(avgFats, avgCalories);
    const consistencyScore = calculateConsistencyScore(dayCount);

    const totalScore = Math.round(
      calorieScore.score * REFERENCE.calories.weight +
      proteinScore.score * REFERENCE.protein.weight +
      carbsScore.score * REFERENCE.carbs.weight +
      fatsScore.score * REFERENCE.fats.weight +
      consistencyScore.score * REFERENCE.consistency.weight
    );

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
    const idealProtein = userMetrics.weight_kg * ideal;
    const maxProtein = userMetrics.weight_kg * max;
    let score = 0;
    let message = "";

    if (avgProtein < min) {
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
      const excessPercent = Math.min((carbPercent - maxPercent) / maxPercent, 1);
      score = 100 - (excessPercent * 50);
      message = "Carbohydrate intake may be higher than ideal. Consider reducing simple carbs.";
    }

    return { score, message };
  };

  const calculateFatsScore = (avgFats, avgCalories) => {
    const { minPercent, idealPercent, maxPercent } = REFERENCE.fats;
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowBreakdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupRef]);

  const toggleBreakdown = (e) => {
    e.stopPropagation();
    setShowBreakdown(prev => !prev);
  };

  const getScoreMessageWithIcon = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <span>{getScoreMessage()}</span>
        <div style={{ position: 'relative', marginLeft: '10px' }}>
          <button 
            onClick={toggleBreakdown}
            style={{
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            aria-label="Show score breakdown"
          >
            i
          </button>
          
          {showBreakdown && (
            <div 
              ref={popupRef}
              style={{
                position: 'absolute',
                top: '50%',
                left: '30px',
                transform: 'translateY(-50%)',
                width: '280px',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '12px',
                zIndex: 100,
                textAlign: 'left',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Score Breakdown:</div>
              <div style={{ marginBottom: '6px' }}><strong>Calories:</strong> {scoreBreakdown.calories.message}</div>
              <div style={{ marginBottom: '6px' }}><strong>Protein:</strong> {scoreBreakdown.protein.message}</div>
              <div style={{ marginBottom: '6px' }}><strong>Carbohydrates:</strong> {scoreBreakdown.carbs.message}</div>
              <div style={{ marginBottom: '6px' }}><strong>Fats:</strong> {scoreBreakdown.fats.message}</div>
              <div><strong>Consistency:</strong> {scoreBreakdown.consistency.message}</div>
              
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '-10px',
                transform: 'translateY(-50%)',
                width: '10px',
                height: '20px',
                clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
                backgroundColor: 'white'
              }}></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="text-center">
      <h2 className="mb-4" style={{ textAlign: 'center' }}>Your Diet Health Score</h2>
      
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
            segmentColors={["#FF4B4B", "#FFA500", "#FFDD00", "#90EE90", "#00FF00"]}
            needleColor="#333"
            textColor="#333"
          />
        </div>
      </div>
      
      <div className="mt-2 mb-3 text-gray-600">
        {getScoreMessageWithIcon()}
      </div>
    </div>
  );
}

export default DietScore; 