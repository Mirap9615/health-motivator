import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#EEEEEE'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (!percent || percent * 100 < 5) {
        return null;
    }

    return (
        <text
            x={x}
            y={y}
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight="bold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const NO_MACRO_DATA = [{ name: 'No Data', value: 1 }];

function DashboardPie({ dietEntries = [], timeView = 'daily' }) {

    const { processedChartData, isDataAvailable } = useMemo(() => {
        let filteredData = [];

        if (!Array.isArray(dietEntries) || dietEntries.length === 0) {
             return { processedChartData: NO_MACRO_DATA, isDataAvailable: false };
        }

        const now = moment();

        if (timeView === 'daily') {
            filteredData = dietEntries.filter(entry =>
                entry?.entry_time && moment(entry.entry_time).isSame(now, 'day')
            );
        } else if (timeView === 'weekly') {
             const weekAgo = moment(now).subtract(6, 'days').startOf('day');
             const endOfToday = moment(now).endOf('day');
            filteredData = dietEntries.filter(entry =>
                 entry?.entry_time && moment(entry.entry_time).isBetween(weekAgo, endOfToday, null, '[]')
            );
        } else {
            filteredData = [];
        }

         if (filteredData.length === 0) {
             return { processedChartData: NO_MACRO_DATA, isDataAvailable: false };
         }

        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;

        filteredData.forEach(entry => {
            totalCarbs += parseFloat(entry.carbs_g) || 0;
            totalProtein += parseFloat(entry.protein_g) || 0;
            totalFats += parseFloat(entry.fats_g) || 0;
        });

        if (totalCarbs <= 0 && totalProtein <= 0 && totalFats <= 0) {
             return { processedChartData: NO_MACRO_DATA, isDataAvailable: false };
        }

        const chartInput = [
            { name: 'Carbs', value: Math.max(0, Math.round(totalCarbs)) },
            { name: 'Proteins', value: Math.max(0, Math.round(totalProtein)) },
            { name: 'Fats', value: Math.max(0, Math.round(totalFats)) },
        ].filter(item => item.value > 0);

         if (chartInput.length === 0) {
            return { processedChartData: NO_MACRO_DATA, isDataAvailable: false };
         }

        return { processedChartData: chartInput, isDataAvailable: true };

    }, [dietEntries, timeView]);


    const totalCalories = useMemo(() => {
        if (!isDataAvailable) return 0;
        return processedChartData.reduce((sum, item) => {
             if (item.name === 'Carbs') return sum + (item.value * 4);
             if (item.name === 'Proteins') return sum + (item.value * 4);
             if (item.name === 'Fats') return sum + (item.value * 9);
             return sum;
        }, 0);
    }, [processedChartData, isDataAvailable]);

    const totalNutrients = useMemo(() => {
        if (!isDataAvailable) return 0;
        return processedChartData.reduce((sum, item) => sum + item.value, 0);
    }, [processedChartData, isDataAvailable]);

    return (
        <div className="macro-chart-container">
             <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={processedChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={0}
                        labelLine={false}
                        label={isDataAvailable ? renderCustomizedLabel : false}
                        isAnimationActive={isDataAvailable}
                        animationDuration={800}
                    >
                        {processedChartData.map((entry, index) => {
                             const fillColor = isDataAvailable
                                 ? COLORS[index % (COLORS.length - 1)]
                                 : COLORS[3];
                             // *** Add the return statement ***
                             return (
                                 <Cell
                                     key={`cell-${index}`}
                                     fill={fillColor}
                                     stroke={isDataAvailable ? '#FFFFFF' : '#CCCCCC'}
                                     strokeWidth={1}
                                  />
                              );
                          })}
                    </Pie>
                    {isDataAvailable && (
                        <Tooltip
                            formatter={(value, name) => [`${value}g`, name]}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '4px', padding: '5px 10px' }}
                            itemStyle={{ color: '#333' }}
                        />
                    )}
                     {isDataAvailable && (
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            iconSize={10}
                            wrapperStyle={{
                                fontSize: '12px',
                                paddingTop: '10px',
                            }}
                        />
                     )}
                </PieChart>
            </ResponsiveContainer>
            <div className="macro-details">
                 {!isDataAvailable ? (
                    <p className="no-data-text">No macro data available for this period.</p>
                ) : (
                    <>
                        {processedChartData.map((data, index) => {
                            const percent = totalNutrients > 0 ? ((data.value / totalNutrients) * 100).toFixed(0) : 0;
                            const colorIndex = index % (COLORS.length - 1);
                            return (
                                <div key={index} className="macro-item" style={{ backgroundColor: COLORS[colorIndex]}}>
                                     <span>{data.name}:</span>
                                     <span>{data.value}g ({percent}%)</span>
                                </div>
                            );
                        })}
                        <p className="macro-calories">Est. Total Calories: {Math.round(totalCalories)} kcal</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default DashboardPie;