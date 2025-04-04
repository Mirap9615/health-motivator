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

router.get("/fitness/past", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const user_id = req.session.user.user_id;

    try {
        const result = await pool.query(
            "SELECT exercise_type, duration_min, calories_burned, steps, entry_time FROM exercise_entries WHERE user_id = $1 ORDER BY entry_time DESC",
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching past fitness entries:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Save a meal template
router.post("/savemeal", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user_id = req.session.user.user_id;
  const { meal_name, meal_type, calories, protein_g, carbs_g, fats_g } = req.body;

  try {
    // Check if the table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'saved_meals'
      );
    `);
    
    // If table doesn't exist, create it
    if (!tableCheck.rows[0].exists) {
      console.log("Creating saved_meals table");
      await pool.query(`
        CREATE TABLE saved_meals (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          meal_name VARCHAR(255) NOT NULL,
          meal_type VARCHAR(50) NOT NULL,
          calories INTEGER NOT NULL,
          protein_g DECIMAL(10, 2),
          carbs_g DECIMAL(10, 2),
          fats_g DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Insert the new meal
    const result = await pool.query(
      "INSERT INTO saved_meals (user_id, meal_name, meal_type, calories, protein_g, carbs_g, fats_g) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [user_id, meal_name, meal_type, calories, protein_g, carbs_g, fats_g]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error saving meal:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get saved meals
router.get("/savedmeals", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user_id = req.session.user.user_id;
  
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'saved_meals'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist, return empty array
      return res.json([]);
    }
    
    const result = await pool.query(
      "SELECT * FROM saved_meals WHERE user_id = $1 ORDER BY meal_name",
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching saved meals:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a saved meal
router.delete("/savedmeals/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user_id = req.session.user.user_id;
  const meal_id = req.params.id;
  
  try {
    const result = await pool.query(
      "DELETE FROM saved_meals WHERE id = $1 AND user_id = $2 RETURNING *",
      [meal_id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }
    
    res.json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Error deleting meal:", error);
    res.status(500).json({ error: "Server error" });
  }
});
/*
// Delete a diet entry
router.delete("/diet/:id", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user_id = req.session.user.user_id;
    const entry_id = req.params.id; // Get the entry ID from the request parameters

    // Log the entry_id for debugging
    console.log("Attempting to delete entry with ID:", entry_id);

    try {
        const result = await pool.query(
            "DELETE FROM diet_entries WHERE id = $1 AND user_id = $2 RETURNING *", // Ensure 'id' matches your table's primary key
            [entry_id, user_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Diet entry not found" });
        }
        
        res.json({ message: "Diet entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting diet entry:", error);
        res.status(500).json({ error: "Server error" });
    }
});
*/

module.exports = router;
