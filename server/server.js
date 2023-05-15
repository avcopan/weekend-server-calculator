/* globals */
const express = require("express");
const app = express();
const PORT = 8000;

// start server spin-up
app.use(express.static("server/public"));

app.listen(PORT, () => {
  console.log("Listening on", PORT);
});
// end server spin-up