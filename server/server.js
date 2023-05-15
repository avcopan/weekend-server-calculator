// globals
const express = require("express");
const app = express();
const PORT = 8000;
const operationSymbol = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};
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
const multiplyAndDivide = (calcArray) => {
  const isMultiplyOrDivide = (element) =>
    element == operationSymbol.multiply || element == operationSymbol.divide;
  while (calcArray.includes(operationSymbol.multiply) ||
         calcArray.includes(operationSymbol.divide)) {
    let opIndex = calcArray.findIndex(isMultiplyOrDivide, calcArray);
    let op = calcArray[opIndex];
    let num1 = calcArray[opIndex - 1];
    let num2 = calcArray[opIndex + 1];
    let result = operationFunction[op](num1, num2);
    console.log(`${opIndex}: ${num1} ${op} ${num2} = ${result}`);
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
  calcArray = multiplyAndDivide(calcArray);
  const answer = Number(calcArray[0]);
  console.log("For with semicolons:");
  for (let i = 1; i < calcArray.length; i += 2) {
    console.log(calcArray[i], calcArray[i + 1]);
  }
  return answer;
};

// server
app.use(express.static("server/public"));
app.use(express.json());

app.post("/calculation", (req, res) => {
  console.log("Received:", req.body);
  answer = calculateAnswer(req.body);
  res.sendStatus(201);
});

app.get("/calculation", (req, res) => {
  res.send(answer);
});

app.listen(PORT, () => {
  console.log("Listening on", PORT);
});
