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

module.exports = router;
