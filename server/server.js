/* globals */
const express = require("express");
const app = express();
const PORT = 8000;
let calcHistory = [];
let currentCalc;

// start server spin-up
app.use(express.static("server/public"));
app.use(express.json());

app.post('/calculation', (req, res) => {
  currentCalc = req.body;
  console.log("Received calculation:", currentCalc);
  res.sendStatus(201);
})

app.listen(PORT, () => {
  console.log("Listening on", PORT);
});
// end server spin-up