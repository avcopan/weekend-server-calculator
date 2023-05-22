// globals
const express = require("express");
const app = express();
const PORT = 8000;
const answerKeyRegExp = RegExp(/Ans(?:wer)?/i);
const numberRegExp = RegExp(/^[+−\-]?\d+(\.\d+)?/);
const operationRegExp = RegExp(/^[+−×÷\-\*\/]?/);
const operationFunction = {
  "+": (num1, num2) => num1 + num2,
  "−": (num1, num2) => num1 - num2,
  "×": (num1, num2) => num1 * num2,
  "÷": (num1, num2) => num1 / num2,
};
let history = [];
let answer = 0;
let error = '';

// functions
/** Parse the next match in a string, string from a certain index
 *
 * @param {*} regex - A regular expression object to search by
 * @param {*} string - A string to be searched
 * @param {*} startIndex - The index to start searching from
 * @returns The matching string segment, or null if no match was found
 */
const parseNext = (regex, string, startIndex) => {
  // do the parsing, starting from the current startIndex
  const execReturn = regex.exec(string.slice(startIndex));
  // if nothing was found, execReturn is null, which is falsey
  if (!execReturn) {
    return [null, startIndex];
  }
  // otherwise, extract the match and update the startIndex
  match = execReturn[0]
  startIndex += match.length;
  return [match, startIndex];
};

/** Parse the calculation input line, generating an array of numbers and operators.
 *
 * @param {string} inputLine - A string representing the raw input.
 *  Example: '-1.0 × 3.5 + 2'].
 * @returns {array} An array of strings alternately encoding numbers and
 *  arithmetic operations. Example: ['-1.0', '×', '3.5', '+', '2'].
 */
const parseCalculationInput = (inputLine) => {
  // First, remove all whitespaces
  inputLine = inputLine.replace(/\s+/g, "");
  // Calculation will be stored as a list of alternating numbers and operations
  // Down the road, this could allow us to implement different orders of
  // operations using parentheses.
  let parseIndex = 0;
  let calcArray = [];
  let operation, answerKey, number;
  let errorMsg = '';
  do {
    if (parseIndex > 0) {
      // If past first number, parse the operation before parsing another
      [operation, parseIndex] = parseNext(operationRegExp, inputLine, parseIndex);
      // Break if nothing was found
      if (!operation) {
        break;
      }
      // Add to operations list, standardizing the operation symbol
      calcArray.push(operation);
    }
    [answerKey, parseIndex] = parseNext(answerKeyRegExp, inputLine, parseIndex);
    if (answerKey) {
      number = answer;
    } else {
      [number, parseIndex] = parseNext(numberRegExp, inputLine, parseIndex);
    }
    // Break if nothing was found
    if (!number) {
      break;
    }
    // Add to numbers list
    calcArray.push(number);
  } while (parseIndex < inputLine.length);

  // If we didn't reach the end of the string, raise an alert and quit the function
  if (parseIndex < inputLine.length) {
    errorMsg = `Failed to interpret input after the ${parseIndex}th character`;
  }

  return [calcArray, errorMsg];
};

/** Evaluate a subset of operations in a calculation array.
 *
 * Example:
 * evaluateOperations(['1', '+', '1', '/', '2', '+', '3'], ['+'])
 * => ['2', '/', '5']
 *
 * @param {array} calcArray - An array of strings alternately encoding numbers
 *  and arithmetic operations. Example: ['-1.0', '×', '3.5', '+', '2'].
 * @param {*} operations - The arithmetic operations to evaluate.
 * @returns A new calculation array, with the operations yet to be evaluated
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
    console.log("Spliced calcArray:", calcArray);
  }
  return calcArray;
};

/** Calculate the final answer of a calculation array.
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
  const inputLine = req.body.inputLine;
  const [calcArray, errorMsg] = parseCalculationInput(inputLine);
  const cleanInputLine = calcArray.join(' ');
  answer = calculateAnswer(calcArray);
  error = errorMsg;
  history.push({
    input: cleanInputLine,
    answer: answer,
  });
  res.sendStatus(201);
});

app.get("/calculation", (req, res) => {
  res.send({ answer: String(answer), history: history, error: error });
});
