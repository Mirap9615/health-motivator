import React, { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
const COLORS = ['#0088FE', '#00C49F', '#FF8042'];


function DashboardPie() {
    const [chartData, setChartData] = useState([
        { name: 'Carbs', value: 400 },
        { name: 'Proteins', value: 300 },
        { name: 'Fats', value: 300 },
      ]);
    
      // Example of updating data dynamically
    const updateData = () => {
      setChartData([
        { name: 'Carbs', value: Math.floor(Math.random() * 500) },
        { name: 'Proteins', value: Math.floor(Math.random() * 500) },
        { name: 'Fats', value: Math.floor(Math.random() * 500) },
      ]);
    };
    const totalCalories = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div style={{ textAlign: 'center' }}>
            <PieChart width={400} height={300}>
            <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
            >
                {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip />
            <Legend />
            </PieChart>
            <div style={{ margin: '8px auto', width: 'fit-content' }}>
              {chartData.map((data, index) => {
                const percent = totalCalories
                  ? ((data.value / totalCalories) * 100).toFixed(1)
                  : 0;
                return (
                  <p key={index} style={{ textAlign: 'left', color: `${COLORS[index]}` }}>
                    {data.name}: {data.value} g ({percent}%)
                  </p>
                );
              })}
              <br />
              <p style={{ fontWeight: 'bold' }}>Total: {totalCalories} kcal</p>
            </div>
            <button onClick={updateData}>
            Randomize Data
            </button>
        </div>
    )
}

export default DashboardPie
