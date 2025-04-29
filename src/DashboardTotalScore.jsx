import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactSpeedometer from "react-d3-speedometer";
import moment from 'moment'; 
import LoadingSpinner from './LoadingSpinner';

// config weights
const DIET_WEIGHT = 0.5; 
const EXERCISE_WEIGHT = 0.5; 
const MAX_GOAL_BONUS_SCORE = 15;
const SPEEDOMETER_MAX_VALUE = 115; 

const calculateDietScoreInternal = (dietData, userProfile) => {
    const REFERENCE = { 
        calories: { min: 1800, max: 2500, weight: 0.3 }, protein: { min: 50, ideal: 0.8, max: 2.0, weight: 0.25 },
        carbs: { min: 130, idealPercent: 0.5, maxPercent: 0.65, weight: 0.2 }, fats: { minPercent: 0.2, idealPercent: 0.3, maxPercent: 0.35, weight: 0.15 },
        consistency: { weight: 0.1 }
    };

    if (!dietData || dietData.length === 0 || !userProfile || !userProfile.weight_kg) {
        return { score: 0, breakdown: null, error: "Missing diet data or user weight" };
    }

    const now = new Date();
    const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentData = dietData.filter(entry => new Date(entry.entry_time) >= past7Days);

    if (recentData.length === 0) {
        return { score: 0, breakdown: null, error: "No recent diet data" };
    }

    const dailyData = {};
    recentData.forEach(entry => { 
        const dateKey = moment(entry.entry_time).format('YYYY-MM-DD');
        if (!dailyData[dateKey]) { dailyData[dateKey] = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }; }
        dailyData[dateKey].calories += Number(entry.calories) || 0; dailyData[dateKey].protein_g += Number(entry.protein_g) || 0;
        dailyData[dateKey].carbs_g += Number(entry.carbs_g) || 0; dailyData[dateKey].fats_g += Number(entry.fats_g) || 0;
    });
    const dayCount = Object.keys(dailyData).length;
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
    Object.values(dailyData).forEach(day => { 
        totalCalories += day.calories; totalProtein += day.protein_g; totalCarbs += day.carbs_g; totalFats += day.fats_g;
    });
    const avgCalories = dayCount > 0 ? totalCalories / dayCount : 0;
    const avgProtein = dayCount > 0 ? totalProtein / dayCount : 0;
    const avgCarbs = dayCount > 0 ? totalCarbs / dayCount : 0;
    const avgFats = dayCount > 0 ? totalFats / dayCount : 0;

    const safeCalculateScore = (calculateFunc, ...args) => {
         try { return calculateFunc(...args); } catch (e) { console.error("Scoring error:", e); return { score: 0, message: "Calculation error" }; }
    }
    const calorieScore = safeCalculateScore(calculateDietCalorieScore, avgCalories, REFERENCE.calories);
    const proteinScore = safeCalculateScore(calculateDietProteinScore, avgProtein, userProfile, REFERENCE.protein);
    const carbsScore = safeCalculateScore(calculateDietCarbsScore, avgCarbs, avgCalories, REFERENCE.carbs);
    const fatsScore = safeCalculateScore(calculateDietFatsScore, avgFats, avgCalories, REFERENCE.fats);
    const consistencyScore = safeCalculateScore(calculateDietConsistencyScore, dayCount);

    const weightedScore = (calorieScore.score * REFERENCE.calories.weight) + (proteinScore.score * REFERENCE.protein.weight) +
                          (carbsScore.score * REFERENCE.carbs.weight) + (fatsScore.score * REFERENCE.fats.weight) +
                          (consistencyScore.score * REFERENCE.consistency.weight);

    const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));

    return {
        score: finalScore,
        breakdown: { 
            calories: calorieScore, protein: proteinScore, carbs: carbsScore,
            fats: fatsScore, consistency: consistencyScore
        },
        error: null
    };
};

const calculateExerciseScoreInternal = (fitnessData, userProfile) => {
    // calculation weights
    const EXERCISE_WEIGHTS = { minutes: 0.50, calories: 0.40, steps: 0.10 };
    const BASE_TARGETS = { stepsPerDay: 8000, minutesPerWeek: 150 };

    if (!fitnessData || !userProfile || !userProfile.activity_level || !userProfile.weight_kg) {
        return { score: 0, breakdown: null, error: "Missing fitness data or user profile info" };
    }

    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekAgoStart = new Date(todayEnd); weekAgoStart.setDate(todayEnd.getDate() - 6); weekAgoStart.setHours(0, 0, 0, 0);
    const recentData = fitnessData.filter(entry => { 
         const entryDate = new Date(entry.entry_time); return entryDate >= weekAgoStart && entryDate <= todayEnd;
    });

    if (recentData.length === 0) {
        return { score: 0, breakdown: null, error: "No recent exercise data" };
    }

    let actualTotalMinutes = 0, actualTotalCalories = 0, actualTotalSteps = 0, hasStepData = false;
    recentData.forEach(entry => { 
         actualTotalMinutes += Number(entry.duration_min) || 0; actualTotalCalories += Number(entry.calories_burned) || 0;
         if (entry.steps != null) { actualTotalSteps += Number(entry.steps) || 0; hasStepData = true; }
    });

    const { targetMinutes, targetCalories, targetWeeklySteps } = getDynamicExerciseTargets(userProfile, BASE_TARGETS);
    const calculateComponentScore = (actual, target, componentName) => {
        if (target <= 0) return { score: 0, message: `Target for ${componentName} not set.` };
        const ratio = Math.min(actual / target, 1.1); let score = Math.min(ratio * 100, 100); let message = "";
        if (ratio >= 1.0) message = `Met/exceeded ${componentName} goal.`;
        else if (ratio >= 0.75) message = `Close to ${componentName} goal.`;
        else if (ratio >= 0.5) message = `Making progress on ${componentName} goal.`;
        else message = `Focus on increasing ${componentName}.`;
        if (actual <= 0) { score = 0; message = `No ${componentName} logged. Aim for ${target}.`; }
        return { score: Math.round(score), message };
    };
    const minutesResult = calculateComponentScore(actualTotalMinutes, targetMinutes, 'minutes');
    const caloriesResult = calculateComponentScore(actualTotalCalories, targetCalories, 'calories');
    const stepsResult = hasStepData ? calculateComponentScore(actualTotalSteps, targetWeeklySteps, 'steps') : { score: 0, message: "Steps not available" };

    let finalScore = 0; let currentWeights = { ...EXERCISE_WEIGHTS };
    if (!hasStepData) {
        const stepWeight = currentWeights.steps; const totalOtherWeight = currentWeights.minutes + currentWeights.calories;
        if (totalOtherWeight > 0) { currentWeights.minutes += stepWeight * (currentWeights.minutes / totalOtherWeight); currentWeights.calories += stepWeight * (currentWeights.calories / totalOtherWeight); }
        currentWeights.steps = 0;
    }
    finalScore = (minutesResult.score * currentWeights.minutes) + (caloriesResult.score * currentWeights.calories) + (stepsResult.score * currentWeights.steps);
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    return {
        score: finalScore,
        breakdown: {
            minutes: { ...minutesResult, actual: Math.round(actualTotalMinutes), target: targetMinutes },
            calories: { ...caloriesResult, actual: Math.round(actualTotalCalories), target: targetCalories },
            steps: { ...stepsResult, actual: Math.round(actualTotalSteps), target: targetWeeklySteps, included: hasStepData }
        },
        error: null
    };
};

const calculateGoalBonusScore = (goalStatus, completedDailyGoals) => {
    if (!goalStatus || !goalStatus.weekly) {
        return { score: 0, message: "Goal data unavailable." };
    }

    const weeklyGoals = goalStatus.weekly;
    const totalWeeklyGoals = 4; 
    const completedWeeklyGoals = weeklyGoals.filter(goal => goal.completed).length;

    const totalDailyGoals = 3 * 7;
    const completedDaily = completedDailyGoals || 0;

    const totalGoals = totalDailyGoals + totalWeeklyGoals;
    const completedGoals = completedDaily + completedWeeklyGoals;

    const completionRatio = completedGoals / totalGoals;
    const bonusScore = Math.round(completionRatio * MAX_GOAL_BONUS_SCORE);

    let message = `${completedGoals}/${totalGoals} goals completed this period.`;
    if (completionRatio >= 1) message = "Excellent! All goals completed!";
    else if (completionRatio >= 0.7) message = "Great job on completing most goals!";
    else if (completionRatio >= 0.4) message = "Good progress on goals!";
    else if (completionRatio > 0) message = "Some goals completed. Keep pushing!";
    else message = "No goals completed yet. Stay focused!";

    return {
        score: bonusScore,
        message,
        completed: completedGoals,
        total: totalGoals
    };
};

function DashboardTotalScore() {

    const [totalScore, setTotalScore] = useState(0);
    const [subScores, setSubScores] = useState({ diet: 0, exercise: 0, goalBonus: 0 }); // Store sub-scores
    const [scoreMessages, setScoreMessages] = useState({ diet: '', exercise: '', goalBonus: '' }); // Store messages
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [userProfile, setUserProfile] = useState(null);
    const [rawDietData, setRawDietData] = useState([]);
    const [rawFitnessData, setRawFitnessData] = useState([]);
    const [goalStatus, setGoalStatus] = useState(null);
    const [dailyGoalStatus, setDailyGoalStatus] = useState([])

    const popupRef = useRef(null);

    const [showBreakdownModal, setShowBreakdownModal] = useState(false);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setTotalScore(0); 

        try {
            const [profileRes, dietRes, fitnessRes, goalsRes, completedDailyGoalsRes] = await Promise.all([
                fetch("/api/user/profile", { credentials: "include" }),
                fetch("/api/entries/diet/past", { credentials: "include" }),
                fetch("/api/entries/fitness/past", { credentials: "include" }),
                fetch("/api/goals", { credentials: "include" }),
                fetch("/api/goals/completed/daily", { credentials: "include" })
            ]);

            if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.statusText}`);
            if (!dietRes.ok) throw new Error(`Diet fetch failed: ${dietRes.statusText}`);
            if (!fitnessRes.ok) throw new Error(`Fitness fetch failed: ${fitnessRes.statusText}`);
            if (!goalsRes.ok) throw new Error(`Goals fetch failed: ${goalsRes.statusText}`);
            if (!completedDailyGoalsRes.ok) throw new Error(`Daily goals fetch failed: ${completedDailyGoalsRes.statusText}`);

            const profileData = await profileRes.json();
            const dietData = await dietRes.json();
            const fitnessData = await fitnessRes.json();
            const goalsData = await goalsRes.json();
            const dailyGoalsData = await completedDailyGoalsRes.json();

             if (!profileData || !profileData.weight_kg || !profileData.activity_level) {
                throw new Error("User profile data (weight, activity) is missing.");
             }

            setUserProfile(profileData);
            setRawDietData(dietData);
            setRawFitnessData(fitnessData);
            setGoalStatus(goalsData);
            setDailyGoalStatus(dailyGoalsData.completedDailyGoals);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message || "Failed to load data.");
            setTotalScore(0); 
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);


    useEffect(() => {
        if (userProfile && rawDietData && rawFitnessData && goalStatus && dailyGoalStatus && !error) {
            setIsLoading(true); 

            const dietResult = calculateDietScoreInternal(rawDietData, userProfile);
            const exerciseResult = calculateExerciseScoreInternal(rawFitnessData, userProfile);
            const goalResult = calculateGoalBonusScore(goalStatus, dailyGoalStatus);

            if(dietResult.error || exerciseResult.error) {
                setError(dietResult.error || exerciseResult.error || "Sub-score calculation failed.");
                setTotalScore(0);
                setSubScores({ diet: 0, exercise: 0, goalBonus: 0 });
                setScoreMessages({ diet: '', exercise: '', goalBonus: '' });
                setIsLoading(false);
                return; 
            }

            const baseScore = (dietResult.score * DIET_WEIGHT) + (exerciseResult.score * EXERCISE_WEIGHT);

            const finalTotalScore = Math.round(baseScore + goalResult.score);

            setTotalScore(finalTotalScore);
            setSubScores({
                diet: dietResult.score,
                exercise: exerciseResult.score,
                goalBonus: goalResult.score
            });
            setScoreMessages({
                diet: getDietScoreMessage(dietResult.score), 
                exercise: getExerciseScoreMessage(exerciseResult.score), 
                goalBonus: goalResult.message
            });
            setError(null); 
            setIsLoading(false); 
        } else if (!isLoading && !error) {
             setIsLoading(false);
             if (!userProfile || !rawDietData || !rawFitnessData || !goalStatus || !dailyGoalStatus) {
                 setError("Could not load all required data.");
             }
        }
    }, [userProfile, rawDietData, rawFitnessData, goalStatus, dailyGoalStatus, error]); 


    const getOverallScoreMessage = (scoreValue) => {
        if (scoreValue >= 105) return "Incredible! You're truly maximizing your health potential!";
        if (scoreValue >= 100) return "Fantastic! You've achieved peak performance and completed extra goals!";
        if (scoreValue >= 90) return "Excellent! Consistently strong health habits.";
        if (scoreValue >= 75) return "Great job! Solid foundation of healthy choices.";
        if (scoreValue >= 60) return "Good! Keep building those healthy routines.";
        if (scoreValue >= 40) return "Fair. Focus on improving consistency.";
        return "Let's work on establishing healthier habits.";
    };

    useEffect(() => { 
        function handleClickOutside(event) { if (popupRef.current && !popupRef.current.contains(event.target)) { setShowBreakdown(false); } }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popupRef]);

    function ScoreMessageAndBreakdown({ totalScore, subScores, scoreMessages, openBreakdownModal }) {
        return (
            <div className="text-center" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '1rem', marginBottom: '8px', color: '#666' }}>
                    {getOverallScoreMessage(totalScore)}
                </div>
                <button
                    onClick={openBreakdownModal}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        marginTop: '6px'
                    }}
                >
                    View Score Breakdown
                </button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="loading-placeholder" style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;
    }

    if (error) {
        return (
            <div className="text-center health-score-error">
                <h2 className="mb-4" style={{ textAlign: 'center' }}>Overall Health Score</h2>
                <p>Error loading: {error}</p>
            </div>
        );
    }

    return (
        <div className="text-center">
            <h2 className="mb-4" style={{ textAlign: 'center' }}>Your Overall Health Score</h2>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto', position: 'relative' }}>
                <div style={{ width: '300px', height: '200px', position: 'relative' }}>
                    <ReactSpeedometer
                        width={300}
                        height={200}
                        value={totalScore} 
                        minValue={0}
                        maxValue={SPEEDOMETER_MAX_VALUE}
                        segments={5} 
                        currentValueText={`${totalScore}`}
                        customSegmentLabels={[
                           { text: "Poor", position: "INSIDE", color: "#555" }, { text: "Fair", position: "INSIDE", color: "#555" },
                           { text: "Good", position: "INSIDE", color: "#555" }, { text: "Great", position: "INSIDE", color: "#555" },
                           { text: "Excellent", position: "INSIDE", color: "#555" },
                        ]}
                        segmentColors={["#FF4B4B", "#FFA500", "#FFDD00", "#90EE90", "#00FF00"]} 
                        needleColor="#333"
                        textColor="#333"
                    />
                </div>
            </div>
            <div className="mt-2 mb-3 text-gray-600">
                <ScoreMessageAndBreakdown
                    totalScore={totalScore}
                    subScores={subScores}
                    scoreMessages={scoreMessages}
                    openBreakdownModal={() => setShowBreakdownModal(true)}
                />
            </div>
            {showBreakdownModal && (
    <div 
        style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}
        onClick={() => setShowBreakdownModal(false)}
    >
        <div 
            onClick={(e) => e.stopPropagation()}
            style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
            }}
        >
            <h3 style={{ marginBottom: '16px' }}>Total Score Breakdown</h3>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Diet</div>
                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{scoreMessages.diet} ({subScores.diet}/100)</div>
                <div style={{ background: '#eee', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${Math.min(subScores.diet, 100)}%`,
                        backgroundColor: '#4CAF50',
                        height: '100%',
                        transition: 'width 0.4s ease'
                    }}></div>
                </div>
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Exercise</div>
                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{scoreMessages.exercise} ({subScores.exercise}/100)</div>
                <div style={{ background: '#eee', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${Math.min(subScores.exercise, 100)}%`,
                        backgroundColor: '#2196F3',
                        height: '100%',
                        transition: 'width 0.4s ease'
                    }}></div>
                </div>
            </div>

            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Goals Bonus</div>
                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{scoreMessages.goalBonus} (+{subScores.goalBonus})</div>
                <div style={{ background: '#eee', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${(subScores.goalBonus / MAX_GOAL_BONUS_SCORE) * 100}%`,
                        backgroundColor: '#FF9800',
                        height: '100%',
                        transition: 'width 0.4s ease'
                    }}></div>
                </div>
            </div>

            <button 
                onClick={() => setShowBreakdownModal(false)}
                style={{
                    marginTop: '12px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                }}
            >
                Close
            </button>
        </div>
    </div>
)}
        </div>
    );
}

// diet score helpers 
function calculateDietCalorieScore(avgCalories, ref) {
    const { min, max } = ref; let score = 0;
    if (avgCalories < min * 0.5) score = 20; else if (avgCalories < min) score = 60 - (((min - avgCalories) / min) * 40);
    else if (avgCalories <= max) score = 90 + (10 * (1 - Math.abs(((avgCalories - min) / (max - min)) - 0.5) * 2));
    else if (avgCalories <= max * 1.5) score = 60 - (((avgCalories - max) / max) * 40); else score = 20;
    return { score: Math.max(0, Math.min(100, Math.round(score))), message: "" }; 
}
function calculateDietProteinScore(avgProtein, profile, ref) { 
    const { min, ideal, max } = ref; const weight = parseFloat(profile.weight_kg); if (!weight) return { score: 0 };
    const idealP = weight * ideal; const maxP = weight * max; let score = 0;
    if (avgProtein < min) score = 60 - (((min - avgProtein) / min) * 60); else if (avgProtein < idealP) score = 60 + (((avgProtein - min) / (idealP - min)) * 40);
    else if (avgProtein <= maxP) score = 100; else score = 100 - (Math.min((avgProtein - maxP) / maxP, 1) * 50);
    return { score: Math.max(0, Math.min(100, Math.round(score))), message: "" };
}
function calculateDietCarbsScore(avgCarbs, avgCalories, ref) { 
    const { min, idealPercent, maxPercent } = ref; if (avgCalories <= 0) return { score: 0 }; const carbCal = avgCarbs * 4; const carbP = carbCal / avgCalories; let score = 0;
    if (avgCarbs < min) score = 60 - (((min - avgCarbs) / min) * 60); else if (carbP < idealPercent) { const baseP = (min * 4 / avgCalories); const range = idealPercent - baseP; const pos = carbP - baseP; score = range > 0 ? (60 + (pos / range) * 40) : 60; }
    else if (carbP <= maxPercent) score = 100; else score = 100 - (Math.min((carbP - maxPercent) / maxPercent, 1) * 50);
    return { score: Math.max(0, Math.min(100, Math.round(score))), message: "" };
 }
function calculateDietFatsScore(avgFats, avgCalories, ref) {
    const { minPercent, idealPercent, maxPercent } = ref; if (avgCalories <= 0) return { score: 0 }; const fatCal = avgFats * 9; const fatP = fatCal / avgCalories; let score = 0;
    if (fatP < minPercent) score = 60 - (((minPercent - fatP) / minPercent) * 60); else if (fatP < idealPercent) { const range = idealPercent - minPercent; const pos = fatP - minPercent; score = 60 + (pos / range) * 40; }
    else if (fatP <= maxPercent) score = 100; else score = 100 - (Math.min((fatP - maxPercent) / maxPercent, 1) * 50);
    return { score: Math.max(0, Math.min(100, Math.round(score))), message: "" };
 }
function calculateDietConsistencyScore(dayCount) { 
    let score = 0; if (dayCount <= 1) score = 0; else if (dayCount <= 3) score = dayCount * 25; else if (dayCount < 7) score = 75 + ((dayCount - 3) * 8.33); else score = 100;
    return { score: Math.round(score), message: "" };
 }
 function getDietScoreMessage(scoreValue) { 
    if (scoreValue >= 90) return "Excellent."; if (scoreValue >= 75) return "Great."; if (scoreValue >= 60) return "Good."; if (scoreValue >= 40) return "Fair."; return "Needs Attention.";
 }


// Exercise Score Helpers
function getDynamicExerciseTargets(profile, baseTargets) { 
    let targetMinutes = baseTargets.minutesPerWeek; let targetStepsPerDay = baseTargets.stepsPerDay; let caloriesPerMinuteMultiplier = 6;
    const activity = profile.activity_level || 'Moderate';
    switch (activity) { case 'Sedentary': targetMinutes = 150; targetStepsPerDay = 5000; caloriesPerMinuteMultiplier = 5; break; case 'Moderate': targetMinutes = 180; targetStepsPerDay = 8000; caloriesPerMinuteMultiplier = 6; break; case 'Intermediate': targetMinutes = 210; targetStepsPerDay = 10000; caloriesPerMinuteMultiplier = 8; break; case 'Challenging': targetMinutes = 240; targetStepsPerDay = 10000; caloriesPerMinuteMultiplier = 10; break; case 'Advanced': targetMinutes = 240; targetStepsPerDay = 12000; caloriesPerMinuteMultiplier = 12; break; }
    const targetCalories = targetMinutes * caloriesPerMinuteMultiplier; const targetWeeklySteps = targetStepsPerDay * 7;
    return { targetMinutes, targetCalories, targetWeeklySteps };
}
function getExerciseScoreMessage(scoreValue) {
     if (scoreValue >= 90) return "Excellent."; if (scoreValue >= 75) return "Great."; if (scoreValue >= 60) return "Good."; if (scoreValue >= 40) return "Fair."; return "Needs Attention.";
}


export default DashboardTotalScore;