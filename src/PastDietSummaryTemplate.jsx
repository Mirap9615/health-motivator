import React from 'react'

function PastDietSummaryTemplate({ pastMacros }) {
    // Calculate totals from the diet logs array
    const calculateTotals = () => {
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fats = 0;
      
      // Iterate through diet logs to sum up nutrients
      pastMacros.forEach(meal => {
        calories += parseFloat(meal.calories) || 0;
        protein += parseFloat(meal.protein_g) || 0;
        carbs += parseFloat(meal.carbs_g) || 0;
        fats += parseFloat(meal.fats_g) || 0;
      });
      
      return { calories, protein, carbs, fats };
    };
    
    // Get calculated totals
    const totals = calculateTotals();
    
  return (
            <div className="nutrition-summary">
                <div className="nutrition-total-item">
                    <span className="nutrition-label">Total Calories</span>
                    <span className="nutrition-value calories">{Math.round(totals.calories)}</span>
                </div>
                
                <div className="nutrition-breakdown">
                    <div className="nutrition-item protein">
                    <div className="nutrition-bar" style={{ width: `${Math.min(100, (totals.protein * 4 / totals.calories) * 100)}%` }}></div>
                    <div className="nutrition-details">
                        <span className="nutrition-label">Protein</span>
                        <span className="nutrition-value">{Math.round(totals.protein)}g</span>
                        <span className="nutrition-percentage">
                        {totals.calories ? Math.round((totals.protein * 4 / totals.calories) * 100) : 0}%
                        </span>
                    </div>
                </div>
                    
                <div className="nutrition-item carbs">
                    <div className="nutrition-bar" style={{ width: `${Math.min(100, (totals.carbs * 4 / totals.calories) * 100)}%` }}></div>
                    <div className="nutrition-details">
                        <span className="nutrition-label">Carbs</span>
                        <span className="nutrition-value">{Math.round(totals.carbs)}g</span>
                        <span className="nutrition-percentage">
                        {totals.calories ? Math.round((totals.carbs * 4 / totals.calories) * 100) : 0}%
                        </span>
                    </div>
                </div>
                    
                <div className="nutrition-item fats">
                    <div className="nutrition-bar" style={{ width: `${Math.min(100, (totals.fats * 9 / totals.calories) * 100)}%` }}></div>
                    <div className="nutrition-details">
                        <span className="nutrition-label">Fats</span>
                        <span className="nutrition-value">{Math.round(totals.fats)}g</span>
                        <span className="nutrition-percentage">
                        {totals.calories ? Math.round((totals.fats * 9 / totals.calories) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
    )
}

export default PastDietSummaryTemplate
