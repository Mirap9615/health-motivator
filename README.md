## Health Motivator

## Overview

Health Motivator is a modern web application designed to help users track their diet and fitness activities, set personalized health goals, and receive AI-driven insights and recommendations to stay motivated on their wellness journey.

Built with a React frontend and a Node.js/Express backend backed by PostgreSQL, this project showcases:

-   Intuitive data visualization for diet and fitness trends (daily, weekly, monthly, annual).
-   Secure user authentication and session management.
-   Personalized goal setting and tracking.
-   AI-powered recommendations for meals, workouts, and health tips tailored to user profiles and goals.
-   A clean, responsive user interface.
-   Backend API for managing user data, entries, and goals.
-   Foundation for backend testing using Jest and Supertest.

## Key Features 

-   **Dashboard:** At-a-glance overview of key metrics, health scores, and daily/weekly progress.
-   **Diet Tracking:** Log meals, visualize calorie/macro intake over time, view summaries.
-   **Fitness Tracking:** Log workouts, track duration, calories burned, steps, and view historical data.
-   **Profile Management:** Update personal details (age, weight, height, activity level) and set personalized health goals (steps, calories, water, etc.).
-   **Goal Checklist:** View daily/weekly system and personalized goals, mark them as complete.
-   **AI Recommendations:** Receive dynamic suggestions for meals, workouts, and health strategies based on user data.
-   **Secure Authentication:** Robust user registration, login, and session handling.

## Tech Stack

-   **Frontend:** React, Vite, React Router, Recharts, Moment.js, CSS
-   **Backend:** Node.js, Express.js
-   **Database:** PostgreSQL
-   **Node Modules:** `pg` (Node-Postgres), `express-session`, `connect-pg-simple`, `bcryptjs`, `cors`, `dotenv`, `express-validator`
-   **Testing:** Jest, Supertest (Backend API Testing)
-   **(Planned/Optional):** CircleCI, Codecov, Frontend Testing Library (React Testing Library, Vitest)

## Prerequisites

-   Node.js (v18 or higher recommended)
-   npm (v9 or higher recommended) or yarn
-   PostgreSQL (Running instance accessible)
-   Git

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/health-motivator.git
    cd health-motivator
    ```

2.  **Backend Setup:**
    ```bash
    cd server
    npm install
    ```
    *   Create a `.env` file in the `server`:
        *   `DATABASE_URL` (e.g., `postgresql://user:password@host:port/database`)
        *   `SESSION_SECRET` 
        *   `PORT` 
    *   **Database Setup:** Connect to your PostgreSQL instance and run the schema creation SQL commands found in `console.sql` to create the necessary tables. 
    *   **Start Backend Server:**
        ```bash
        npm run dev
        # OR
        node index.cjs
        ```
        The server is hosted on `http://localhost:3000`.

3.  **Frontend Setup:**
    *   Navigate back to the project root (if you were in `server`): `cd ..`
    *   Install frontend dependencies:
        ```bash
        npm install
        ```
    *   **Start Frontend Development Server:**
        ```bash
        npm run dev
        ```
        The frontend should typically be accessible at `http://localhost:3000`.

## Running Tests

-   **Backend API Tests:**
    ```bash
    cd server
    npm test
    # Or, if you configure a specific test script: npm run test:api
    ```

-   **(Planned) Test Coverage:**
    ```bash
    cd server
    npm run test:coverage
    ```

## Usage 

1.  Ensure both the backend and frontend servers are running.
2.  Open your browser and navigate to the frontend URL (`http://localhost:3000`).
3.  **Register** a new account or **Login** with existing credentials.
4.  Navigate through the application using the **Sidebar**.
5.  View your personalized **Dashboard**.
6.  Go to the **Diet** or **Fitness** pages to view historical data and trends. 
7.  Visit the **Profile** page to view your details and goals. Click "Edit" to make changes and "Save".
8.  Interact with the **Checklist** on the Dashboard to view/complete goals and see AI **Recommendations**. Click recommendation buttons to view details in a modal.

## Development Workflow

1.  Create a new branch: `git checkout -b feature/your-feature-name`
2.  Make changes and write corresponding tests (backend and/or frontend).
3.  Run backend tests: `cd server && npm test`
4.  *(Optional)* Run frontend tests: `npm test` (if configured)
5.  Ensure code quality checks pass (linting, formatting - configure pre-commit hooks if desired).
6.  Commit changes and push the branch.
7.  Create a Pull Request on GitHub.

## API Endpoints Overview 

-   `/api/auth/register` - Register new user
-   `/api/auth/login` - Log in user
-   `/api/auth/check` - Validates user session, cookies, general auth 
-   `/api/auth/logout` - Log out user
-   `/api/auth/check` - Check current authentication status
-   `/api/user/profile` - GET / PUT user profile details
-   `/api/user/goals` - GET / PUT user health goals
-   `/api/entries/diet` - creates new diet entry 
-   `/api/entries/diet/past` - GET past diet entries
-   `/api/entries/diet:id` - DEL a saved diet entry  
-   `/api/entries/exercise` - creates new fitness entry 
-   `/api/entries/fitness/past` - GET past fitness entries
-   `/api/entries/savemeal` - GET / PUT a new meal template, :id for del 
-   `/api/goals` - GET system goals combined with user completion
-   `/api/goals/:goalKey/toggle` - POST to toggle goal completion
-   `/api/goals/completed/daily` - GET daily completed goals 
-   `/api/ai/generate` - POST to get AI-generated responses
-   `/api/ai/test` - tests AI connection w/ test prompts

## Future Improvements

-   **Data Entry UI:** Implement forms for easily adding Diet and Fitness entries directly within the app.
-   **Enhanced AI:** More sophisticated prompts, fine-tuning, ability for users to interact more deeply with AI suggestions.
-   **Notifications:** Reminders for logging, goal progress, etc.
-   **Social Features:** (Optional) Sharing progress with friends.
-   **More Comprehensive Testing:** Unit tests for frontend components, end-to-end tests.
-   **Deployment:** Configuration for deploying to platforms like Heroku, Vercel, or AWS.
-   **Accessibility (a11y):** Continued improvements for screen reader and keyboard navigation support.
-   **PWA Features:** Offline support, installability.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow. Ensure tests pass and code adheres to existing style conventions.

[![Coverage Status](https://img.shields.io/codecov/c/github/mirap9615/health-motivator)](https://codecov.io/gh/mirap9615/health-motivator)


