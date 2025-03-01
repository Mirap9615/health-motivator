const express = require("express");
const pool = require("./db.cjs");
const router = express.Router();

router.post("/diet", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    
    const user_id = req.session.user.user_id;
    const { meal_type, calories, protein_g, carbs_g, fats_g, entry_time } = req.body;

    try {
        await pool.query(
            "INSERT INTO diet_entries (user_id, meal_type, calories, protein_g, carbs_g, fats_g, entry_time) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [user_id, meal_type, calories, protein_g, carbs_g, fats_g, entry_time]
        );

    res.json({ message: "Diet entry saved!" });
  } catch (error) {
    console.error("Error saving diet entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/exercise", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    
    const user_id = req.session.user.user_id;
  const { exercise_type, duration_min, calories_burned, steps, entry_time } = req.body;

  try {
    await pool.query(
      "INSERT INTO exercise_entries (user_id, exercise_type, duration_min, calories_burned, steps, entry_time) VALUES ($1, $2, $3, $4, $5, $6)",
      [user_id, exercise_type, duration_min, calories_burned, steps, entry_time]
    );

    res.json({ message: "Exercise entry saved!" });
  } catch (error) {
    console.error("Error saving exercise entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/diet/past", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const user_id = req.session.user.user_id;

    try {
        const result = await pool.query(
            "SELECT meal_type, calories, protein_g, carbs_g, fats_g, entry_time FROM diet_entries WHERE user_id = $1 ORDER BY entry_time DESC",
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching past diet entries:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
