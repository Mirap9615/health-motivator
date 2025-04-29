import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactSpeedometer from "react-d3-speedometer";
import moment from 'moment';
import LoadingSpinner from './LoadingSpinner'; 

// weights for score components
const EXERCISE_WEIGHTS = {
    minutes: 0.50,
    calories: 0.40, 
    steps: 0.10,   
};

const BASE_TARGETS = {
    stepsPerDay: 8000,
    minutesPerWeek: 150,
};

function DashboardExerciseScore() {
    const [score, setScore] = useState(0);
    const [scoreBreakdown, setScoreBreakdown] = useState({
        minutes: { score: 0, actual: 0, target: 0, message: "" },
        calories: { score: 0, actual: 0, target: 0, message: "" },
        steps: { score: 0, actual: 0, target: 0, message: "" },
    });

    const [userProfile, setUserProfile] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showBreakdown, setShowBreakdown] = useState(false);
    const popupRef = useRef(null);

    const fetchDataAndCalculate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setScore(0);

        try {
            const [profileResponse, fitnessResponse] = await Promise.all([
                fetch("/api/user/profile", { credentials: "include" }),
                fetch("/api/entries/fitness/past", { credentials: "include" }) 
            ]);

            if (!profileResponse.ok) {
                throw new Error(`Failed to fetch profile: ${profileResponse.statusText}`);
            }
            const fetchedUserProfile = await profileResponse.json();
            if (!fetchedUserProfile || !fetchedUserProfile.activity_level || !fetchedUserProfile.weight_kg) {
                throw new Error("User profile data (activity level, weight) is missing. Cannot calculate exercise score accurately.");
            }
            setUserProfile(fetchedUserProfile);

            if (!fitnessResponse.ok) {
                throw new Error(`Failed to fetch fitness data: ${fitnessResponse.statusText}`);
            }
            const fetchedFitnessData = await fitnessResponse.json();

            calculateExerciseScore(fetchedFitnessData, fetchedUserProfile);

        } catch (err) {
            console.error("Error fetching data or calculating exercise score:", err);
            setError(err.message || "Failed to load exercise score data.");
            setScore(0);
            setScoreBreakdown({ /* Reset breakdown */ });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDataAndCalculate();
    }, [fetchDataAndCalculate]);


    const getDynamicTargets = (currentUserProfile) => {
        let targetMinutes = BASE_TARGETS.minutesPerWeek;
        let targetStepsPerDay = BASE_TARGETS.stepsPerDay;
        let caloriesPerMinuteMultiplier = 6; // Default (Moderate)

        const activity = currentUserProfile.activity_level || 'Moderate';

        switch (activity) {
            case 'Sedentary':
                targetMinutes = 150;
                targetStepsPerDay = 5000;
                caloriesPerMinuteMultiplier = 5;
                break;
            case 'Moderate':
                targetMinutes = 180;
                targetStepsPerDay = 8000;
                caloriesPerMinuteMultiplier = 6;
                break;
            case 'Intermediate':
                targetMinutes = 210;
                targetStepsPerDay = 10000;
                caloriesPerMinuteMultiplier = 8;
                break;
            case 'Challenging':
                targetMinutes = 240;
                targetStepsPerDay = 10000;
                caloriesPerMinuteMultiplier = 10;
                break;
            case 'Advanced':
                targetMinutes = 240;
                targetStepsPerDay = 12000;
                caloriesPerMinuteMultiplier = 12;
                break;
            default:
                break;
        }

        // weekly calorie target derived from minutes target and intensity multiplier
        const targetCalories = targetMinutes * caloriesPerMinuteMultiplier;
        const targetWeeklySteps = targetStepsPerDay * 7;

        return { targetMinutes, targetCalories, targetWeeklySteps };
    };


    // main calculation logic ---
    const calculateExerciseScore = (fitnessData, currentUserProfile) => {
        if (!fitnessData || !currentUserProfile) {
            setError("Missing data for calculation.");
            setScore(0);
            return;
        }

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const weekAgoStart = new Date(todayEnd);
        weekAgoStart.setDate(todayEnd.getDate() - 6); 
        weekAgoStart.setHours(0, 0, 0, 0);

        const recentData = fitnessData.filter(entry => {
            const entryDate = new Date(entry.entry_time);
            return entryDate >= weekAgoStart && entryDate <= todayEnd;
        });

        if (recentData.length === 0) {
            setError("No exercise entries found in the last 7 days.");
            setScore(0);
             const targets = getDynamicTargets(currentUserProfile);
             setScoreBreakdown({
                minutes: { score: 0, actual: 0, target: targets.targetMinutes, message: "No recent activity logged." },
                calories: { score: 0, actual: 0, target: targets.targetCalories, message: "No recent activity logged." },
                steps: { score: 0, actual: 0, target: targets.targetWeeklySteps, message: "No recent step data." },
             });
            return;
        }

        let actualTotalMinutes = 0;
        let actualTotalCalories = 0;
        let actualTotalSteps = 0;
        let hasStepData = false; 

        recentData.forEach(entry => {
            actualTotalMinutes += Number(entry.duration_min) || 0;
            actualTotalCalories += Number(entry.calories_burned) || 0;
            if (entry.steps != null) { 
                 actualTotalSteps += Number(entry.steps) || 0;
                 hasStepData = true; 
            }
        });

        const { targetMinutes, targetCalories, targetWeeklySteps } = getDynamicTargets(currentUserProfile);

        const calculateComponentScore = (actual, target, componentName) => {
            if (target <= 0) return { score: 0, message: `Target for ${componentName} not set.` };

            const ratio = Math.min(actual / target, 1.1);
            let score = Math.min(ratio * 100, 100);
            let message = "";

            if (ratio >= 1.0) message = `Excellent! You met or exceeded your ${componentName} goal.`;
            else if (ratio >= 0.75) message = `Good job! You're close to your ${componentName} goal.`;
            else if (ratio >= 0.5) message = `Making progress on your ${componentName} goal. Keep it up!`;
            else message = `Focus on increasing your ${componentName}.`;

            if (actual <= 0) {
                score = 0;
                message = `No ${componentName} logged recently. Aim for ${target}.`;
            }


            return { score: Math.round(score), message };
        };

        const minutesResult = calculateComponentScore(actualTotalMinutes, targetMinutes, 'weekly minutes');
        const caloriesResult = calculateComponentScore(actualTotalCalories, targetCalories, 'weekly calories burned');
        const stepsResult = hasStepData ? calculateComponentScore(actualTotalSteps, targetWeeklySteps, 'weekly steps') : { score: 0, message: "Step data not consistently available." };

        let finalScore = 0;
        let currentWeights = { ...EXERCISE_WEIGHTS };

        if (!hasStepData) {
            const stepWeight = currentWeights.steps;
            const totalOtherWeight = currentWeights.minutes + currentWeights.calories;
            if (totalOtherWeight > 0) { 
                 currentWeights.minutes += stepWeight * (currentWeights.minutes / totalOtherWeight);
                 currentWeights.calories += stepWeight * (currentWeights.calories / totalOtherWeight);
            }
            currentWeights.steps = 0; 
        }

        finalScore = (minutesResult.score * currentWeights.minutes) +
                     (caloriesResult.score * currentWeights.calories) +
                     (stepsResult.score * currentWeights.steps); 

        finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

        // Update state
        setScore(finalScore);
        setScoreBreakdown({
            minutes: { ...minutesResult, actual: Math.round(actualTotalMinutes), target: targetMinutes },
            calories: { ...caloriesResult, actual: Math.round(actualTotalCalories), target: targetCalories },
            steps: { ...stepsResult, actual: Math.round(actualTotalSteps), target: targetWeeklySteps, included: hasStepData }, // Add flag if steps counted
        });
        setError(null); 
    };


    const getScoreMessage = () => {
        if (score >= 90) return "Excellent! Your activity level is fantastic.";
        if (score >= 75) return "Great job! You're consistently active.";
        if (score >= 60) return "Good! Keep up the regular exercise.";
        if (score >= 40) return "Fair. Aim for more consistent activity.";
        return "Let's get moving! Try to increase your activity.";
    };

    useEffect(() => { 
        function handleClickOutside(event) {
             if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowBreakdown(false);
             }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popupRef]);

    const toggleBreakdown = (e) => { 
         e.stopPropagation();
         setShowBreakdown(prev => !prev);
    };

    if (isLoading) {
        return <div className="loading-placeholder" style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading exercise score...</div>;
    }

    if (error) {
        return (
            <div className="text-center health-score-error">
                <h2 className="mb-4" style={{ textAlign: 'center' }}>Exercise Health Score</h2>
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="text-center">
            <h2 className="mb-4" style={{ textAlign: 'center' }}>Your Exercise Health Score</h2>
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
                {getScoreMessage()}
            </div>

            <div className="exercise-breakdown-bars" style={{ marginTop: '20px', width: '80%', marginLeft: 'auto', marginRight: 'auto' }}>
                {/* Minutes Section */}
                {scoreBreakdown.minutes && (
                    <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Minutes</div>
                    <div style={{ marginBottom: '8px', fontSize: '0.95rem' }}>
                        {scoreBreakdown.minutes.message} ({scoreBreakdown.minutes.actual} / {scoreBreakdown.minutes.target} min)
                    </div>
                    <div style={{ background: '#eee', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                        <div
                        style={{
                            width: `${Math.min((scoreBreakdown.minutes.actual / scoreBreakdown.minutes.target) * 100, 100)}%`,
                            backgroundColor: '#4CAF50',
                            height: '100%',
                            transition: 'width 0.4s ease',
                        }}
                        ></div>
                    </div>
                    </div>
                )}

                {/* Calories Section */}
                {scoreBreakdown.calories && (
                    <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Calories</div>
                    <div style={{ marginBottom: '8px', fontSize: '0.95rem' }}>
                        {scoreBreakdown.calories.message} (~{scoreBreakdown.calories.actual} / {scoreBreakdown.calories.target} kcal)
                    </div>
                    <div style={{ background: '#eee', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                        <div
                        style={{
                            width: `${Math.min((scoreBreakdown.calories.actual / scoreBreakdown.calories.target) * 100, 100)}%`,
                            backgroundColor: '#2196F3',
                            height: '100%',
                            transition: 'width 0.4s ease',
                        }}
                        ></div>
                    </div>
                    </div>
                )}

                {/* Steps Section */}
                {scoreBreakdown.steps?.included && (
                    <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Steps</div>
                    <div style={{ marginBottom: '8px', fontSize: '0.95rem' }}>
                        {scoreBreakdown.steps.message} ({scoreBreakdown.steps.actual} / {scoreBreakdown.steps.target})
                    </div>
                    <div style={{ background: '#eee', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                        <div
                        style={{
                            width: `${Math.min((scoreBreakdown.steps.actual / scoreBreakdown.steps.target) * 100, 100)}%`,
                            backgroundColor: '#FF9800',
                            height: '100%',
                            transition: 'width 0.4s ease',
                        }}
                        ></div>
                    </div>
                    </div>
                )}

                {!scoreBreakdown.steps?.included && (
                    <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '8px', textAlign: 'center' }}>
                    (Step score not included due to insufficient data)
                    </div>
                )}

                </div>
        </div>
    );
}

export default DashboardExerciseScore;