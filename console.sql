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
