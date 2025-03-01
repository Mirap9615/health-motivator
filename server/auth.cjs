const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const pool = require("./db.cjs");

const router = express.Router();

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password too short"),
    body("name").not().isEmpty().withMessage("Name is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
        [name, email, hashedPassword]
      );

      req.session.user = {
        user_id: newUser.rows[0].user_id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
      };

      res.status(201).json({ message: "Registration successful", user: req.session.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").not().isEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userQuery.rows.length === 0) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const user = userQuery.rows[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      req.session.user = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      };

      res.json({ message: "Login successful", user: req.session.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ message: "Logout successful" });
  });
});

module.exports = router;
