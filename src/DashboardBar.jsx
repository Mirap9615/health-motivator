import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

// Sample static data - this will be replaced by real data from props
const sampleData = [
  { day: 'Mon', calories: 400 },
  { day: 'Tue', calories: 300 },
  { day: 'Wed', calories: 500 },
  { day: 'Thu', calories: 700 },
  { day: 'Fri', calories: 600 },
  { day: 'Sat', calories: 800 },
  { day: 'Sun', calories: 400 },
];

const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

// Days of the week in order from Sunday to Saturday
const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DashboardBar({ dataLabel, dataColor, chartData = sampleData }) {
  // Create a complete dataset with all days, ensuring days with no data still appear
  const completeData = dayOrder.map(day => {
    const dayData = chartData.find(item => item.day === day);
    // If day exists in chartData use it, otherwise create a new entry with 0 calories
    return dayData || { day, calories: 0 };
  });
  
  // Sort data to ensure days are always in Sunday to Saturday order
  const sortedData = [...completeData].sort((a, b) => {
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  });

  return (
    <div className="chart-container">
      <p className="chart-title">{dataLabel}</p>
      <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                interval={0} // Force display of all tick labels
                padding={{ left: 10, right: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calories" fill={dataColor} name="Calories" label={{ 
                position: 'top', 
                fill: '#333', 
                fontSize: 12,
                formatter: (value) => value > 0 ? value : '' // Only show labels for non-zero values
              }}>
              {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              </Bar>
          </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DashboardBar
