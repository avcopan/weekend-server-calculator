/* globals */
const express = require("express");
const app = express();
const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server running on: ${PORT}`);
});

app.get("/testing", (req, res) => {
  res.send("TESTING TESTING");
});
