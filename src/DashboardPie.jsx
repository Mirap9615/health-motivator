import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const COLORS = ['#0088FE', '#00C49F', '#FF8042'];

// Custom label renderer with smaller text
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 0.8;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text 
            x={x} 
            y={y} 
            fill="#333" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            fontSize={11}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

function DashboardPie({ timeView = 'daily' }) {
    const [chartData, setChartData] = useState([
        { name: 'Carbs', value: 0 },
        { name: 'Proteins', value: 0 },
        { name: 'Fats', value: 0 },
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [dietData, setDietData] = useState([]);
    
    // Fetch diet data from the backend
    useEffect(() => {
        const fetchDietData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/entries/diet/past');
                const data = await response.json();
                setDietData(data);
                processData(data, timeView);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching diet data:', error);
                setIsLoading(false);
            }
        };
        
        fetchDietData();
    }, []);
    
    // Process data whenever timeView changes
    useEffect(() => {
        if (dietData.length > 0) {
            processData(dietData, timeView);
        }
    }, [timeView, dietData]);
    
    // Process and aggregate diet data based on the time view
    const processData = (data, view) => {
        if (!data || data.length === 0) {
            setChartData([
                { name: 'Carbs', value: 0 },
                { name: 'Proteins', value: 0 },
                { name: 'Fats', value: 0 },
            ]);
            return;
        }
        
        // Filter data based on time view
        let filteredData = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (view === 'daily') {
            // Get entries from today
            filteredData = data.filter(entry => {
                const entryDate = new Date(entry.entry_time);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === today.getTime();
            });
        } else if (view === 'weekly') {
            // Get entries from the past 7 days
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            
            filteredData = data.filter(entry => {
                const entryDate = new Date(entry.entry_time);
                return entryDate >= weekAgo && entryDate <= today;
            });
        }
        
        // Calculate totals
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;
        
        filteredData.forEach(entry => {
            totalCarbs += Number(entry.carbs_g) || 0;
            totalProtein += Number(entry.protein_g) || 0;
            totalFats += Number(entry.fats_g) || 0;
        });
        
        // Update chart data
      setChartData([
            { name: 'Carbs', value: Math.round(totalCarbs) },
            { name: 'Proteins', value: Math.round(totalProtein) },
            { name: 'Fats', value: Math.round(totalFats) },
      ]);
    };
    
    const totalNutrients = chartData.reduce((sum, item) => sum + item.value, 0);
    // Estimate total calories (4 cal/g for carbs and protein, 9 cal/g for fat)
    const totalCalories = 
        (chartData[0].value * 4) + // Carbs: 4 cal/g
        (chartData[1].value * 4) + // Protein: 4 cal/g
        (chartData[2].value * 9);  // Fats: 9 cal/g

    if (isLoading) {
        return <div>Loading macro data...</div>;
    }

    return (
        <div className="macro-chart-container">
            <ResponsiveContainer width={320} height={250}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                        outerRadius={90}
                        innerRadius={0}
                        labelLine={false}
                        label={renderCustomizedLabel}
            >
                {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
                    <Tooltip formatter={(value) => `${value}g`} />
                    <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{
                            fontSize: '12px',
                            paddingTop: '10px'
                        }}
                    />
            </PieChart>
            </ResponsiveContainer>
            <div className="macro-details">
              {chartData.map((data, index) => {
                    const percent = totalNutrients
                        ? ((data.value / totalNutrients) * 100).toFixed(1)
                  : 0;
                return (
                        <p key={index} className="macro-item" style={{ backgroundColor: `${COLORS[index]}`, color: 'black' }}>
                    {data.name}: {data.value} g ({percent}%)
                  </p>
                );
              })}
                <p className="macro-calories">Est. Calories: {Math.round(totalCalories)} kcal</p>
            </div>
        </div>
    )
}

export default DashboardPie
