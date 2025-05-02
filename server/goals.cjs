const express = require("express");
const pool = require("./db.cjs");
const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

const getUserGoals = async (userId, client = pool) => {
    let goalsQuery = await client.query("SELECT * FROM user_goals WHERE user_id = $1", [userId]);
    if (goalsQuery.rows.length === 0) {
        console.log(`No goals found for user ${userId}, creating default entry.`);
        goalsQuery = await client.query(
            "INSERT INTO user_goals (user_id) VALUES ($1) RETURNING *",
            [userId]
        );
    }
    const { goal_id, user_id: _, created_at, updated_at, ...userGoals } = goalsQuery.rows[0];
    return userGoals;
};

router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;

    try {
        const [systemGoalsResult, userGoals, completionResult] = await Promise.all([
            pool.query('SELECT goal_key, goal_text, goal_type FROM system_goals ORDER BY goal_type, goal_key'),
            getUserGoals(userId),
            pool.query(`
                SELECT goal_key, completed_at
                FROM goal_completion
                WHERE user_id = $1
                  AND (
                      completion_period_start = CURRENT_DATE
                      OR
                      completion_period_start = DATE_TRUNC('week', CURRENT_DATE)::DATE
                  )
            `, [userId])
        ]);

        const allSystemGoals = systemGoalsResult.rows;

        const completionMap = new Map();
        completionResult.rows.forEach(row => {
            if (row.completed_at) {
                completionMap.set(row.goal_key, true);
            }
        });

        const goals = {
            daily: [],
            weekly: [],
        };

        allSystemGoals.forEach(goal => {
            let dynamicText = goal.goal_text;

            switch (goal.goal_key) {
                case 'daily_steps':
                    dynamicText = `Achieve ${userGoals.target_daily_steps?.toLocaleString() || 'N/A'} steps today`;
                    break;
                case 'daily_cardio':
                    const weeklyMinutes = userGoals.target_weekly_workout_minutes;
                    const dailyMinutes = weeklyMinutes ? Math.round(weeklyMinutes / 7) : 'N/A';
                    dynamicText = `Complete ${dailyMinutes} minutes of cardio`;
                    break;
                case 'daily_water':
                    dynamicText = `Drink ${userGoals.target_water_intake || 'N/A'} glasses of water`;
                    break;
            }

            const goalData = {
                key: goal.goal_key,
                text: dynamicText,
                completed: completionMap.has(goal.goal_key)
            };

            if (goal.goal_type === 'daily') {
                goals.daily.push(goalData);
            } else if (goal.goal_type === 'weekly') {
                goals.weekly.push(goalData);
            }
        });

        res.json(goals);

    } catch (error) {
        console.error("Error fetching combined goals:", error);
        res.status(500).json({ error: "Server error fetching goals" });
    }
});

router.post('/:goalKey/toggle', isAuthenticated, async (req, res) => {
    const userId = req.session.user.user_id;
    const { goalKey } = req.params;

    if (!goalKey) {
        return res.status(400).json({ error: "Goal key is required" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const goalTypeResult = await client.query('SELECT goal_type FROM system_goals WHERE goal_key = $1', [goalKey]);
        if (goalTypeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "System goal key not found." });
        }
        const goalType = goalTypeResult.rows[0].goal_type;

        const periodStartDateQuery = goalType === 'daily' ? 'SELECT CURRENT_DATE AS period_start;' : 'SELECT DATE_TRUNC(\'week\', CURRENT_DATE)::DATE AS period_start;';
        const periodResult = await client.query(periodStartDateQuery);
        const periodStartDate = periodResult.rows[0].period_start;

        const completionCheck = await client.query('SELECT completion_id FROM goal_completion WHERE user_id = $1 AND goal_key = $2 AND completion_period_start = $3', [userId, goalKey, periodStartDate]);

        let completedStatus;
        if (completionCheck.rows.length > 0) {
            await client.query('DELETE FROM goal_completion WHERE completion_id = $1', [completionCheck.rows[0].completion_id]);
            completedStatus = false;
        } else {
            await client.query('INSERT INTO goal_completion (user_id, goal_key, completion_period_start, completed_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)', [userId, goalKey, periodStartDate]);
            completedStatus = true;
        }

        await client.query('COMMIT');
        res.json({ message: "Goal status updated", completed: completedStatus });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error toggling goal completion:", error);
        res.status(500).json({ error: "Server error toggling goal status" });
    } finally {
        client.release();
    }
});

router.get('/completed/daily', isAuthenticated, async (req, res) => {
     const userId = req.session.user.user_id;
    try {
        const result = await pool.query(`
            SELECT COUNT(*) FROM goal_completion
            WHERE user_id = $1
              AND goal_key IN (SELECT goal_key FROM system_goals WHERE goal_type = 'daily')
              AND completion_period_start >= (CURRENT_DATE - INTERVAL '6 days')
              AND completed_at IS NOT NULL
        `, [userId]);
        const completedDailyGoals = parseInt(result.rows[0].count, 10);
        res.json({ completedDailyGoals });
    } catch (error) {
        console.error("Error fetching daily goal completions:", error);
        res.status(500).json({ error: "Server error fetching daily completions" });
    }
});

module.exports = router;