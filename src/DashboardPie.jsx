import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#EEEEEE'];

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
    const [isNoData, setIsNoData] = useState(false);

    
    useEffect(() => {
        const fetchDietData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/entries/diet/past');
                const data = await response.json();
                setDietData(data);
                processData(data, timeView);
                console.log(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching diet data:', error);
                setIsLoading(false);
            }
        };
        
        fetchDietData();
    }, []);
    
    useEffect(() => {
        if (dietData.length > 0) {
            processData(dietData, timeView);
        }
    }, [timeView, dietData]);
    
    const processData = (data, view) => {
        let filteredData = [];

        if (!data || data.length === 0) {
            setChartData([
                { name: 'No Data', value: 0 },
                { name: 'No Data', value: 0 },
                { name: 'No Data', value: 0 },
            ]);
            setIsNoData(true);
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (view === 'daily') {
            filteredData = data.filter(entry => {
                const entryDate = new Date(entry.entry_time);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === today.getTime();
            });
        } else if (view === 'weekly') {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            
            filteredData = data.filter(entry => {
                const entryDate = new Date(entry.entry_time);
                return entryDate >= weekAgo && entryDate <= today;
            });
        }

        if (filteredData.length === 0) {
            setChartData([
                { name: 'No Data', value: 0 },
                { name: 'No Data', value: 0 },
                { name: 'No Data', value: 0 },
            ]);
            setIsNoData(true);
            return;
        } else {
            setIsNoData(false);
        }
        
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;
        
        filteredData.forEach(entry => {
            totalCarbs += Number(entry.carbs_g) || 0;
            totalProtein += Number(entry.protein_g) || 0;
            totalFats += Number(entry.fats_g) || 0;
        });

        const hasMacros = totalCarbs > 0 || totalProtein > 0 || totalFats > 0;

        if (!hasMacros) {
            setChartData([
                { name: 'No Data', value: 0 },
                { name: 'No Data', value: 0 },
                { name: 'No Data', value: 0 },
            ]);
            setIsNoData(true);
            return;
        } else {
            setIsNoData(false);
        }
        
      setChartData([
            { name: 'Carbs', value: Math.round(totalCarbs) },
            { name: 'Proteins', value: Math.round(totalProtein) },
            { name: 'Fats', value: Math.round(totalFats) },
      ]);
    };
    
    const totalNutrients = chartData.reduce((sum, item) => sum + item.value, 0);
    const totalCalories = isNoData ? 0 : (
        (chartData[0].value * 4) +
        (chartData[1].value * 4) +
        (chartData[2].value * 9)
    );

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
                isAnimationActive={!isNoData}
                animationDuration={800}
            >
                {chartData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={chartData.length === 1 && chartData[0].name === 'No Data' 
                    ? '#EEEEEE' 
                    : COLORS[index % COLORS.length]} 
                />
                ))}
            </Pie>
                <Tooltip 
                formatter={(value, name) => 
                    chartData.length === 1 && chartData[0].name === 'No Data'
                    ? ['N/A', 'Not enough data']
                    : [`${value}g`, name]
                }
                />
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
            {chartData.length === 1 && chartData[0].name === 'No Data' ? (
                <p style={{ fontSize: '14px', color: '#777' }}>Not enough data to display breakdown.</p>
                ) : (
                chartData.map((data, index) => {
                    const percent = totalNutrients ? ((data.value / totalNutrients) * 100).toFixed(1) : 0;
                    return (
                    <p key={index} className="macro-item" style={{ backgroundColor: `${COLORS[index]}`, color: 'black' }}>
                        {data.name}: {data.value} g ({percent}%)
                    </p>
                    );
                })
            )}
            {!isNoData && (
                <p className="macro-calories">Est. Calories: {Math.round(totalCalories)} kcal</p>
            )}
            </div>
        </div>
    )
}

export default DashboardPie
