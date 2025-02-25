import React from 'react';
import SideBar from './SideBar.jsx';
import { Card, Title, Text, Progress, Grid } from '@mantine/core';
import './Dashboard.css';

function Dashboard() {
    return (
        <div className="dashboard-container">
            <SideBar />
            <div className="dashboard-content">
                <Title order={1} className="dashboard-title">Dashboard</Title>

                <Card shadow="sm" padding="lg" className="health-score-card">
                    <Title order={3} className="section-title">Your Health Score</Title>
                    <div className="progress-container">
                        <Progress value={75} size="lg" color="green" />
                        <Text className="progress-label">75/100</Text>
                    </div>
                    <Text color="dimmed" size="sm">Based on your recent activity and diet.</Text>
                </Card>


                <Grid gutter="md" className="dashboard-grid">
        
                    <Grid.Col span={6}>
                        <Card shadow="sm" padding="lg" className="dashboard-card">
                            <Title order={4} className="section-title">Exercise Tracking</Title>
                            <Text>Steps Today: <strong>8,250</strong></Text>
                            <Text>Calories Burned: <strong>450 kcal</strong></Text>
                            <Text>Last Workout: <strong>30 min jog</strong></Text>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Card shadow="sm" padding="lg" className="dashboard-card">
                            <Title order={4} className="section-title">Diet Tracking</Title>
                            <Text>Calories Consumed: <strong>1,800 kcal</strong></Text>
                            <Text>Protein: <strong>120g</strong></Text>
                            <Text>Carbs: <strong>200g</strong></Text>
                            <Text>Fats: <strong>50g</strong></Text>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Card shadow="sm" padding="lg" className="dashboard-card">
                            <Title order={4} className="section-title">General Health</Title>
                            <Text>Weight: <strong>165 lbs</strong></Text>
                            <Text>Heart Rate: <strong>72 BPM</strong></Text>
                            <Text>Sleep: <strong>7 hours</strong></Text>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <Card shadow="sm" padding="lg" className="dashboard-card">
                            <Title order={4} className="section-title">Daily Goals</Title>
                            <Text>Water Intake: <strong>6/8 cups</strong></Text>
                            <Text>Workout Goal: <strong>Completed</strong></Text>
                            <Text>Calorie Target: <strong>⚠️ 200 kcal over</strong></Text>
                        </Card>
                    </Grid.Col>
                </Grid>
            </div>
        </div>
    );
}

export default Dashboard;
