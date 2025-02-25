const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json()); 


app.listen(port, () => {
console.log(`Server listening on ${port}`);
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) =>{
res.sendFile(path.join(__dirname, '../dist/index.html'));
});