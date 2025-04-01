const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./db.cjs");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json()); 

app.use(
    session({
        store: new pgSession({
        pool: pool, 
        tableName: "session", 
        }),
        secret: process.env.SESSION_SECRET, 
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
    })
);

const isAuthenticated = (req, res, next) => {
if (req.session.user) {
    next();
} else {
    res.status(401).json({ message: "Unauthorized" });
}
};

const authRoutes = require("./auth.cjs");
const userRoutes = require("./user.cjs");
const entryRoutes = require("./entries.cjs");
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/entries", entryRoutes);

app.listen(port, () => {
console.log(`Server listening on ${port}`);
console.log(process.env.SESSION_SECRET);

});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
res.sendFile(path.join(__dirname, '../dist/index.html'));
});