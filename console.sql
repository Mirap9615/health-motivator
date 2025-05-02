CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    profile_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    age INT NOT NULL,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    activity_level VARCHAR(50) CHECK (activity_level IN ('Sedentary', 'Moderate', 'Intermediate', 'Challenging', 'Advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

CREATE TABLE diet_entries (
    entry_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    meal_type VARCHAR(20) CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
    calories INT NOT NULL,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fats_g DECIMAL(5,2),
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercise_entries (
    entry_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    exercise_type VARCHAR(255) NOT NULL,
    duration_min INT NOT NULL,
    calories_burned INT,
    steps INT,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_scores (
    score_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    health_score DECIMAL(5,2) NOT NULL,
    feedback TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE TABLE user_recommendations (
    recommendation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    recommendation_text TEXT NOT NULL,
    recommendation_type VARCHAR(50) CHECK (recommendation_type IN (
        'daily_meal', 'daily_workout', 'daily_tip',
        'weekly_meal_plan', 'weekly_workout_plan', 'weekly_health_strategy'
    )) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT true,
    ai_prompt_details JSONB NULL,
    previous_recommendation_id UUID REFERENCES user_recommendations(recommendation_id) NULL
);

CREATE INDEX idx_user_recommendations_user_current ON user_recommendations (user_id, is_current, recommendation_type);

CREATE TABLE system_goals (
    goal_key VARCHAR(50) PRIMARY KEY, 
    goal_text TEXT NOT NULL,
    goal_type VARCHAR(10) CHECK (goal_type IN ('daily', 'weekly')) NOT NULL
);

INSERT INTO system_goals (goal_key, goal_text, goal_type) VALUES
('daily_cardio', 'Complete 30 minutes of cardio', 'daily'),
('daily_vegetables', 'Eat 5 servings of vegetables', 'daily'),
('daily_water', 'Drink 8 glasses of water', 'daily'),
('weekly_strength', 'Complete 3 strength training sessions', 'weekly'),
('weekly_recipe', 'Try one new healthy recipe', 'weekly'),
('weekly_rest', 'Take a rest day', 'weekly'),
('weekly_tracking', 'Track all meals for the week', 'weekly');

CREATE TABLE goal_completion (
    completion_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_key VARCHAR(50) REFERENCES system_goals(goal_key) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    completion_period_start DATE NOT NULL,
    completed_at TIMESTAMP NULL,
    UNIQUE (user_id, goal_key, completion_period_start)
);

CREATE INDEX idx_goal_completion_user_period_key ON goal_completion (user_id, completion_period_start, goal_key);

CREATE TABLE user_goals (
    goal_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_daily_steps INT NOT NULL DEFAULT 8000,
    target_weekly_workout_minutes INT NOT NULL DEFAULT 150,
    target_calorie_intake INT NOT NULL DEFAULT 2500,
    target_water_intake INT NOT NULL DEFAULT 8,
    target_sleep_hours DECIMAL(3,1) NOT NULL DEFAULT 8.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON user_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();