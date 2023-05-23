// globals
const express = require("express");
const parseParens = require("paren");
const app = express();
const PORT = 8000;
const answerKeyRegExp = RegExp(/^Ans(?:wer)?/i);
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
/** Parse the next match in a string, starting from a certain index
 *
 * @param {*} regex - A regular expression object to search by
 * @param {*} string - A string to be searched
 * @param {*} parseIndex - The index to start searching from
 * @returns The matching string segment, or null if no match was found
 */
const parseNext = (regex, string, parseIndex) => {
  // Parse, starting from startIndex
  const searchString = string.slice(parseIndex);
  const execReturn = regex.exec(searchString);
  // If nothing was found, execReturn is null, which is falsey
  if (!execReturn) {
    return [null, parseIndex];
  }
  // Otherwise, extract the match and update the parseIndex
  match = execReturn[0];
  parseIndex += match.length;
  return [match, parseIndex];
};

/** Parse a simple calculation string, consisting of numbers and operators
 *  without parentheses.
 *
 * @param {String} calcString - A string of the form "1+2+−3+4÷10"
 * @param {Boolean} opStart - Does this string start with an operator?
 * @param {Boolean} opEnd - Does this string end with an operator?
 * @returns An array of alternating numbers and operators
 */
const parseCalcString = (calcString, opStart, opEnd) => {
  let parseIndex = 0;
  let calcArray = [];
  let match, lastMatch;
  do {
    // Check for an operator, if appropriate
    if (opStart || parseIndex > 0) {
      [match, parseIndex] = parseNext(operationRegExp, calcString, parseIndex);
      // If no operator was found, assume multiplication
      match = match ? match : "×";
      calcArray.push(match); // push operator to `calcArray`
      lastMatch = match;
    }
    // Check for an answer keyword before checking for a number
    [match, parseIndex] = parseNext(answerKeyRegExp, calcString, parseIndex);
    if (match) {
      match = answer;
    } else {
      // If no answer keyword was found, check for a number
      [match, parseIndex] = parseNext(numberRegExp, calcString, parseIndex);
    }

    // If nothing was found, something is wrong, so break out of the do loop
    if (!match) {
      break;
    } else {
      // Make sure the number found uses the right minus sign for String =>
      // Number conversion during evaluation.
      match = match.replace("−", "-");
    }
    calcArray.push(match); // push number to `calcArray`
    lastMatch = match;
  } while (parseIndex < calcString.length);

  // Check for an ending operator, if requested
  // The second condition anticipates the case where calcString is an
  // intervening string containing *only* an operator (i.e. '+'), in which case
  // we have already parsed the ending operator.
  if (opEnd && !["+", "−", "×", "÷"].includes(lastMatch)) {
    [match, parseIndex] = parseNext(operationRegExp, calcString, parseIndex);
    // If no operator was found, assume multiplication
    match = match ? match : "×";
    calcArray.push(match); // push operator to `calcArray`
  }

  // If we failed to parse the string, return null
  const failedToParse = parseIndex < calcString.length;
  return failedToParse ? null : calcArray;
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

  // This array will store strings where parsing failed
  let badStrings = [];

  /** A recursive function for parsing a nested list of `calcStrings` */
  const parseCalcStrings = (calcStrings) => {
    // The following Booleans are used to flag whether a calcString should start
    // and/or end with an operator. It should start with an operator if it
    // follows another calcString. If should end with one if it precedes another
    // calcString.
    let opStart = false;
    let opEnd = false;
    let calcArrays = [];
    for (let [index, calcString] of calcStrings.entries()) {
      if (Array.isArray(calcString)) {
        // If this is an array, call the function recursively
        let calcArray = parseCalcStrings(calcString);
        calcArrays.push(calcArray);
      } else {
        // If this is a string, parse it to generate a `calcArray`
        opStart = index > 0;
        opEnd = index < calcStrings.length - 1;
        let calcArray = parseCalcString(calcString, opStart, opEnd, badStrings);
        if (!calcArray) {
          // If `null` was returned, this was a bad string
          badStrings.push(calcString);
        } else {
          // Otherwise, extend the `calcArray`
          calcArrays.push(...calcArray);
        }
      }
    }
    return calcArrays;
  };

  // Use `paren` module to parse parentheses
  let calcStrings = parseParens(inputLine);
  // Recursively convert the nested `calcStrings` to `calcArrays`
  let calcArrays = parseCalcStrings(calcStrings);

  // If we ran into any bad strings, make an error message to be sent back to
  // the client
  let errorMsg = "";
  if (badStrings.length > 0) {
    errorMsg = "Failed to parse this part: ";
    errorMsg += badStrings.map((s) => `'${s}'`).join(", ");
  }

  return [calcArrays, errorMsg];
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
    // Update the calculation, replacing this operation with the result
    calcArray.splice(opIndex - 1, 3, result);
  }
  return calcArray;
};

/** Evaluate the mathematical result of a nested calculation array.
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

  // If there are no arrays in `calcArrays`, then this is a simple `calcArray`
  // of the form ['1', '+', '2', ....], which can be directly evaluated.

  // To respect order of operations, evaluate multiplication and division before
  // addition and subtraction
  calcArrays = evaluateOperations(calcArrays, ["×", "÷"]);
  calcArrays = evaluateOperations(calcArrays, ["+", "−"]);

  // If everything worked correctly, `calcArrays` should now have length 1
  console.assert(
    calcArrays.length == 1,
    "After evaluating all operations, calcArray should consist of a",
    "single element, but it doesn't",
    calcArrays
  );
  const evalWorked = calcArrays.length == 1;
  return evalWorked ? Number(calcArrays[0]) : NaN;
};

/** Clean up the inputLine, for reporting history to the DOM
 *
 * @param {string} inputLine - The raw input line
 * @returns The cleaned up input line
 */
const formatInputLineForHistory = (inputLine) => {
  // First, remove whitespaces
  inputLine = inputLine.replace(/\s+/g, "");
  // Insert multiplication symbols when one set of parentheses immediately
  // follows another
  inputLine = inputLine.replace(/\)\(/g, ")×(");
  // Then, add whitespace back in, but only around operators
  inputLine = inputLine.replace(/([+−×÷])/g, " $1 ");
  // Consistently format answer keywords
  inputLine = inputLine.replace(/Ans(?:wer)/gi, "Ans");
  return inputLine;
};

const formatAnswerNumber = (number, returnNaN) => {
  if (number && !returnNaN) {
    number = Number(number.toFixed(11));
  } else {
    number = NaN;
  }
  return String(number);
}

// server
app.use(express.static("server/public"));
app.use(express.json());

app.listen(PORT, () => {
  console.log("Listening on", PORT);
});

app.post("/calculation", (req, res) => {
  console.log("Received:", req.body);
  const inputLine = req.body.inputLine;
  const [calcArrays, errorMsg] = parseInputLine(inputLine);
  answer = formatAnswerNumber(evaluateCalcArrays(calcArrays), errorMsg);
  error = errorMsg;
  history.push({
    input: formatInputLineForHistory(inputLine),
    answer: answer.replace('-', '−'),
  });
  res.sendStatus(201);
});

app.get("/calculation", (req, res) => {
  res.send({ answer, history, error });
});
