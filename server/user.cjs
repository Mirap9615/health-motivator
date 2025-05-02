const express = require("express");
const pool = require("./db.cjs");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.get("/profile", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { user_id } = req.session.user;

    const userQuery = await pool.query("SELECT name, email FROM users WHERE user_id = $1", [user_id]);
    const profileQuery = await pool.query(
      "SELECT age, weight_kg, height_cm, gender, activity_level FROM user_profiles WHERE user_id = $1",
      [user_id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userQuery.rows[0];
    const profile = profileQuery.rows.length > 0 ? profileQuery.rows[0] : {};

    res.json({ ...user, ...profile });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/profile",
  [
    body("age").isInt({ min: 1 }).withMessage("Valid age is required."),
    body("weight_kg").isFloat({ gt: 0 }).withMessage("Valid weight (kg) is required."),
    body("height_cm").isFloat({ gt: 0 }).withMessage("Valid height (cm) is required."),
    body("gender").isIn(["Male", "Female", "Other"]).withMessage("Invalid gender selected."),
    body("activity_level").isIn(["Sedentary", "Moderate", "Intermediate", "Challenging", "Advanced"]).withMessage("Invalid activity level selected."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.session.user.user_id;
    const { age, weight_kg, height_cm, gender, activity_level } = req.body;

    try {
      const profileQuery = `
           INSERT INTO user_profiles (user_id, age, weight_kg, height_cm, gender, activity_level)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id)
           DO UPDATE SET
               age = EXCLUDED.age,
               weight_kg = EXCLUDED.weight_kg,
               height_cm = EXCLUDED.height_cm,
               gender = EXCLUDED.gender,
               activity_level = EXCLUDED.activity_level,
               created_at = CURRENT_TIMESTAMP -- Update timestamp on conflict update
           RETURNING *;
       `;
      const values = [userId, age, weight_kg, height_cm, gender, activity_level];
      const result = await pool.query(profileQuery, values);

      res.status(200).json({ message: "Profile saved successfully!", profile: result.rows[0] });

    } catch (err) {
      console.error("Error saving initial profile:", err);
      res.status(500).json({ error: "Server error while saving profile data." });
    }
  }
);

router.put(
  "/profile",
  [
    body("name").optional().not().isEmpty().withMessage("Name cannot be empty"),
    body("age").optional().isInt({ min: 0 }).withMessage("Age must be a valid number"),
    body("weight_kg").optional().isFloat({ min: 0 }).withMessage("Weight must be a valid number"),
    body("height_cm").optional().isFloat({ min: 0 }).withMessage("Height must be a valid number"),
    body("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
    body("activity_level")
      .optional()
      .isIn(["Sedentary", "Moderate", "Intermediate", "Challenging", "Advanced"])
      .withMessage("Invalid activity level"),
  ],
  async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { user_id } = req.session.user;
      const { name, age, weight_kg, height_cm, gender, activity_level } = req.body;

      if (name) {
        await pool.query("UPDATE users SET name = $1 WHERE user_id = $2", [name, user_id]);
      }

      const profileExists = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [user_id]);

      if (profileExists.rows.length > 0) {
        await pool.query(
          `UPDATE user_profiles 
           SET age = COALESCE($1, age), weight_kg = COALESCE($2, weight_kg), height_cm = COALESCE($3, height_cm), 
               gender = COALESCE($4, gender), activity_level = COALESCE($5, activity_level) 
           WHERE user_id = $6`,
          [age, weight_kg, height_cm, gender, activity_level, user_id]
        );
      } else {
        await pool.query(
          "INSERT INTO user_profiles (user_id, age, weight_kg, height_cm, gender, activity_level) VALUES ($1, $2, $3, $4, $5, $6)",
          [user_id, age, weight_kg, height_cm, gender, activity_level]
        );
      }

      res.json({ message: "Profile updated successfully" });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/goals", async (req, res) => {
  const { user_id } = req.session.user; 

  try {
      let goalsQuery = await pool.query("SELECT * FROM user_goals WHERE user_id = $1", [user_id]);

      if (goalsQuery.rows.length === 0) {
          console.log(`No goals found for user ${user_id}, creating default entry.`);
          goalsQuery = await pool.query(
              "INSERT INTO user_goals (user_id) VALUES ($1) RETURNING *",
              [user_id]
          );
      }

      const { goal_id, user_id: _, created_at, updated_at, ...userGoals } = goalsQuery.rows[0];
      res.json(userGoals);

  } catch (err) {
      console.error(`Error fetching/creating goals for user ${user_id}:`, err);
      res.status(500).json({ error: "Server error retrieving goals." });
  }
});

router.put(
  "/goals",
  [ 
      body("target_daily_steps").isInt({ min: 0 }).withMessage("Daily steps must be a non-negative number."),
      body("target_weekly_workout_minutes").isInt({ min: 0 }).withMessage("Workout minutes must be a non-negative number."),
      body("target_calorie_intake").isInt({ min: 0 }).withMessage("Calorie intake must be a non-negative number."),
      body("target_water_intake").isInt({ min: 0 }).withMessage("Water intake must be a non-negative number."),
      body("target_sleep_hours").isFloat({ min: 0, max: 24 }).withMessage("Sleep hours must be a valid number between 0 and 24."),
  ],
  async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const { user_id } = req.session.user;
      const {
          target_daily_steps,
          target_weekly_workout_minutes,
          target_calorie_intake,
          target_water_intake,
          target_sleep_hours
      } = req.body;

      try {
          const updateQuery = `
              INSERT INTO user_goals (
                  user_id, target_daily_steps, target_weekly_workout_minutes,
                  target_calorie_intake, target_water_intake, target_sleep_hours, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
              ON CONFLICT (user_id)
              DO UPDATE SET
                  target_daily_steps = EXCLUDED.target_daily_steps,
                  target_weekly_workout_minutes = EXCLUDED.target_weekly_workout_minutes,
                  target_calorie_intake = EXCLUDED.target_calorie_intake,
                  target_water_intake = EXCLUDED.target_water_intake,
                  target_sleep_hours = EXCLUDED.target_sleep_hours,
                  updated_at = NOW()
              RETURNING *; -- Return updated goals
          `;
          const values = [
              user_id,
              target_daily_steps,
              target_weekly_workout_minutes,
              target_calorie_intake,
              target_water_intake,
              target_sleep_hours
          ];

          const result = await pool.query(updateQuery, values);

          const { goal_id, user_id: _, created_at, updated_at, ...updatedGoals } = result.rows[0];

          res.json({ message: "Goals updated successfully", goals: updatedGoals });

      } catch (err) {
          console.error(`Error updating goals for user ${user_id}:`, err);
          res.status(500).json({ error: "Server error updating goals." });
      }
  }
);

module.exports = router;
