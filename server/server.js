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
let answer = "0";
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

/** Parse a simple calculation string, consisting of numbers and operators
 *
 * @param {String} calcString - A string of the form "1+2+−3+4÷10"
 * @param {Boolean} opStart - Does this string start with an operator?
 * @param {Boolean} opEnd - Does this string end with an operator?
 * @returns An array of alternating numbers and operators
 */
const parseCalcString = (calcString, opStart, opEnd) => {
  // Calculation will be stored as a list of alternating numbers and operations
  // Down the road, this could allow us to implement different orders of
  // operations using parentheses.
  let parseIndex = 0;
  let calcArray = [];
  let match, lastMatch;
  do {
    // If we are are past the beginning, or the string starts with an operator,
    // check for an operator
    if (opStart || parseIndex > 0) {
      [match, parseIndex] = parseNext(operationRegExp, calcString, parseIndex);
      // If no operator was found, assume multiplication
      match = match ? match : "×";
      calcArray.push(match);
      lastMatch = match;
    }
    // Check whether the next segment matches the Ans/Answer keyword
    [match, parseIndex] = parseNext(answerKeyRegExp, calcString, parseIndex);
    if (match) {
      match = answer;
    } else {
      // If no Ans/Answer keyword was found, check for a number
      [match, parseIndex] = parseNext(numberRegExp, calcString, parseIndex);
    }
    // Break if nothing was found
    if (match) {
      match = match.replace("−", "-");
    } else {
      break;
    }
    // Add to numbers list
    calcArray.push(match);
    lastMatch = match;
  } while (parseIndex < calcString.length);

  // Check for an ending operator, if requested, but not if the last match was
  // an operator (happens when the string *only* contained an operator)
  if (opEnd && !["+", "−", "×", "÷"].includes(lastMatch)) {
    [operation, parseIndex] = parseNext(
      operationRegExp,
      calcString,
      parseIndex
    );
    // If no operator was found, assume multiplication
    calcArray.push(operation ? operation : "×");
  }

  return calcArray;
};

/** Parse the calculation input line, generating a (potentially nested) array of
 *  numbers and operators.
 *
 * Example logic:
 *  let inputLine = "1+2+(5-(2*3))/(5+7)";
 *  let calcStrings = parseParens(inputLine);
 *   => ['1+2+', ['5-', ['2*3']], '/', ['5+7']]
 *  let calcArray = parseCalcStringsRecursively(calcStrings);
 *   => ['1', '+', '2', '+', ['5', '-', ['2', '*', '3']], '/', ['5', '+', '7']]
 *
 * @param {string} inputLine - A string representing the raw input (example above).
 * @returns {array} A (potentially nested) array of strings alternately encoding
 *  numbers and arithmetic operations.
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
      // If this is an array, call the function recursively
      if (Array.isArray(calcString)) {
        let calcArray = parseCalcStringsRecursively(calcString);
        /* ^^^ recursive call here ^^^ */
        calcArrays.push(calcArray);
      // Otherwise, split the string into a calcArray
      } else {
        // After the first entry, each string should start with an operator
        opStart = index > 0;
        // Up to the last entry, each string should end with an operator
        opEnd = index < calcStrings.length - 1;
        let calcArray = parseCalcString(calcString, opStart, opEnd);
        calcArrays.push(...calcArray);
      }
    }
    return calcArrays;
  };

  // Use paren module to parse parentheses
  let calcStrings = parseParens(inputLine);
  // Recursively calculate the resulting nested array
  let calcArrays = parseCalcStringsRecursively(calcStrings, 0);
  return calcArrays;
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
 * @param {array} calcArrays - An array of strings alternately encoding numbers
 * and arithmetic operations.
 * @returns {number} The final result of the calculation.
 */
const evaluateCalcArrays = (calcArrays) => {

  while (calcArrays.some(Array.isArray)) {
    // If there is an array in `calcArrays`, evaluate it recursively
    const arrIndex = calcArrays.findIndex(Array.isArray);
    result = evaluateCalcArrays(calcArrays[arrIndex]);
    /* ^^^ recursive call here ^^^ */
    calcArrays.splice(arrIndex, 1, result);
  }
  // If there are no arrays in `calcArrays`, evaluate it directly
  // Evaluate multiplication and division
  calcArrays = evaluateOperations(calcArrays, ["×", "÷"]);
  // Evaluate addition and subtraction
  calcArrays = evaluateOperations(calcArrays, ["+", "−"]);

  // We should now only have one element remaining
  console.assert(
    calcArrays.length == 1,
    "After evaluating all operations, calcArray should consist of a",
    "single element, but it doesn't",
    calcArrays
  );
  return calcArrays[0];
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
  const calcArrays = parseInputLine(inputLine);
  console.log("calcArrays:", calcArrays);
  answer = String(evaluateCalcArrays(calcArrays));
  console.log("Calculated answer:", answer);
  error = "";
  history.push({
    input: inputLine,
    answer: answer,
  });
  res.sendStatus(201);
});

app.get("/calculation", (req, res) => {
  res.send({ answer, history, error });
});
