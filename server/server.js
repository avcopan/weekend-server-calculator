// globals
const express = require("express");
const app = express();
const PORT = 8000;
const operationFunction = {
  "+": (num1, num2) => num1 + num2,
  "−": (num1, num2) => num1 - num2,
  "×": (num1, num2) => num1 * num2,
  "÷": (num1, num2) => num1 / num2,
};
let calcHistory = [];
let answer;

// functions
/** Evaluates certain operations in a calculation array.
 *
 * @param {array} calcArray - An array of strings alternately encoding numbers
 * and arithmetic operations.
 * @param {*} operations - The arithmetic operations to evaluate.
 * @returns The a new calculation array, after evaluating the requested operations.
 */
const evaluateOperations = (calcArray, operations) => {
  const isRequestedOp = (item) => operations.includes(item);
  while (calcArray.some(isRequestedOp)) {
    let opIndex = calcArray.findIndex(isRequestedOp, calcArray);
    // Get the operation and the numbers involved
    let op = calcArray[opIndex];
    let num1 = Number(calcArray[opIndex - 1]);
    let num2 = Number(calcArray[opIndex + 1]);
    // Evaluate to get the result
    let result = operationFunction[op](num1, num2);
    console.log(`${opIndex}: ${num1} ${op} ${num2} = ${result}`);
    // Update the calculation, replacing this operation with the result
    calcArray.splice(opIndex - 1, 3, result);
    console.log("Sliced calcArray:", calcArray);
  }
  return calcArray;
};

/** Evaluate a calculation encoded in an array of strings.
 *
 * @param {array} calcArray - An array of strings alternately encoding numbers
 * and arithmetic operations.
 * @returns {number} The final result of the calculation.
 */
const calculateAnswer = (calcArray) => {
  // Evaluate multiplication and division
  calcArray = evaluateOperations(calcArray, ["×", "÷"]);
  // Evaluate addition and subtraction
  calcArray = evaluateOperations(calcArray, ["+", "−"]);
  // We should now only have one element remaining
  console.assert(
    calcArray.length == 1,
    "After evaluating all operations, calcArray should consist of a",
    "single element, but it doesn't",
    calcArray
  );
  return calcArray[0];
};

// server
app.use(express.static("server/public"));
app.use(express.json());

app.listen(PORT, () => {
  console.log("Listening on", PORT);
});

app.post("/calculation", (req, res) => {
  console.log("Received:", req.body);
  answer = calculateAnswer(req.body);
  console.log("Calculated answer:", answer);
  res.sendStatus(201);
});

app.get("/calculation", (req, res) => {
  console.log("Attempting to send answer:", answer);
  res.send(String(answer));
});
