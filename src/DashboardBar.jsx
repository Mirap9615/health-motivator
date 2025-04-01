import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'M', calories: 400 },
  { day: 'T', calories: 300 },
  { day: 'W', calories: 500 },
  { day: 'Th', calories: 700 },
  { day: 'F', calories: 600 },
  { day: 'Sa', calories: 800 },
  { day: 'Su', calories: 400 },
];

const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

function DashboardBar({dataLabel, dataColor}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="calories" fill={dataColor} name={dataLabel} label={{ position: 'top', fill: '#333', fontSize: 12 }}>
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
  )
}

export default DashboardBar
