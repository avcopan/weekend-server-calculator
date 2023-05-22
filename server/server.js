// globals
const express = require("express");
const parseParens = require("paren");
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
let error = "";

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
  match = execReturn[0];
  startIndex += match.length;
  return [match, startIndex];
};

/** Parse the calculation input line, generating an array of numbers and operators.
 * 
 * Example logic:
 *  let inputLine = "1+2+(5-(2*3))/(5+7)";
 *  let calcStrings = parseParens(inputLine);
 *   => ['1+2+', ['5-', ['2*3']], '/', ['5+7']]
 *  let calcArray = parseCalcStringsRecursively(calcStrings);
 *   => ['1', '+', '2', '+', ['5', '-', ['2', '*', '3']], '/', ['5', '+', '7']]
 *
 * @param {string} inputLine - A string representing the raw input.
 *  Example: '-1.0 × 3.5 + 2'].
 * @returns {array} An array of strings alternately encoding numbers and
 *  arithmetic operations. Example: ['-1.0', '×', '3.5', '+', '2'].
 */
const parseInputLine = (inputLine) => {
  // First, to simplify parsing, remove all whitespace from inputLine
  inputLine = inputLine.replace(/\s+/g, "");
  // Insert multiplication symbols when one set of parentheses immediately
  // follows another
  inputLine = inputLine.replace(/\)\(/g, ")×(");

  const parseCalcStringsRecursively = (calcStrings) => {
    // Booleans used to flag whether a segment should start and/or end with an
    // operator. It should start with an operator if it follows another segment.
    // It should end with an operator if there are further segments after it.
    let opStart = false;
    let opEnd = false;
    let calcArrays = [];
    for (let [index, calcString] of calcStrings.entries()) {
      if (Array.isArray(calcString)) {
        let calcArray = parseCalcStringsRecursively(calcString);
        /* ^^^ recursive call here ^^^ */
        calcArrays.push(calcArray);
      } else {
        // After the first entry, each string should start with an operator
        opStart = index > 0;
        // Up to the last entry, each string should end with an operator
        opEnd = index < calcStrings.length - 1;
        let calcArray = parseCalcStringNew(calcString, opStart, opEnd);
        calcArrays.push(...calcArray);
      }
    }
    return calcArrays;
  }

  // Use paren module to parse parentheses
  let calcStrings = parseParens(inputLine);
  // Recursively calculate the resulting nested array
  let calcArrays = parseCalcStringsRecursively(calcStrings, 0);
  console.log("calcArrays", calcArrays);
  console.log("calcArrays stringified", JSON.stringify(calcArrays));
  console.log("END praseCalcStrings FUNCTION HERE");
}
const parseCalcStringNew = (calcString, opStart, opEnd) => {
  // Calculation will be stored as a list of alternating numbers and operations
  // Down the road, this could allow us to implement different orders of
  // operations using parentheses.
  console.log(`parsing string '${calcString}'`);
  let parseIndex = 0;
  let calcArray = [];
  let match, lastMatch;
  do {
    // If we are are past the beginning, or the string starts with an operator,
    // check for an operator
    if (opStart || parseIndex > 0) {
      [match, parseIndex] = parseNext(
        operationRegExp,
        calcString,
        parseIndex
      );
      // If no operator was found, assume multiplication
      match = match ? match: "×";
      calcArray.push(match); lastMatch = match;
    }
    // Check whether the next segment matches the Ans/Answer keyword
    [match, parseIndex] = parseNext(answerKeyRegExp, calcString, parseIndex);
    if (!match) {
      // If no Ans/Answer keyword was found, check for a number
      [match, parseIndex] = parseNext(numberRegExp, calcString, parseIndex);
    }
    // Break if nothing was found
    if (!match) {
      break;
    }
    // Add to numbers list
    calcArray.push(match); lastMatch = match;
  } while (parseIndex < calcString.length);

  // Check for an ending operator, if requested, but not if the last match was
  // an operator (happens when the string *only* contained an operator)
  console.log("last match:", lastMatch)
  if (opEnd && !["+", "−", "×", "÷"].includes(lastMatch)) {
    [operation, parseIndex] = parseNext(
      operationRegExp,
      calcString,
      parseIndex
    );
    // If no operator was found, assume multiplication
    calcArray.push(operation ? operation: "×");
  }

  return calcArray;
};
const parseCalcString = (calcString) => {
  // First, remove all whitespaces
  calcString = calcString.replace(/\s+/g, "");
  // Calculation will be stored as a list of alternating numbers and operations
  // Down the road, this could allow us to implement different orders of
  // operations using parentheses.
  let parseIndex = 0;
  let calcArray = [];
  let operation, answerKey, number;
  let errorMsg = "";
  do {
    if (parseIndex > 0) {
      // If past first number, parse the operation before parsing another
      [operation, parseIndex] = parseNext(
        operationRegExp,
        calcString,
        parseIndex
      );
      // Break if nothing was found
      if (!operation) {
        break;
      }
      // Add to operations list, standardizing the operation symbol
      calcArray.push(operation);
    }
    [answerKey, parseIndex] = parseNext(answerKeyRegExp, calcString, parseIndex);
    if (answerKey) {
      number = answer;
    } else {
      [number, parseIndex] = parseNext(numberRegExp, calcString, parseIndex);
    }
    // Break if nothing was found
    if (!number) {
      break;
    }
    // Add to numbers list
    calcArray.push(number);
  } while (parseIndex < calcString.length);

  // If we didn't reach the end of the string, raise an alert and quit the function
  if (parseIndex < calcString.length) {
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
const evaluateCalcArray = (calcArray) => {
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
  parseInputLine(inputLine);
  const [calcArray, errorMsg] = parseCalcString(inputLine);
  const cleanInputLine = calcArray.join(" ");
  answer = evaluateCalcArray(calcArray);
  console.log("Calculated answer:", answer);
  console.log("Error message:", errorMsg);
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
