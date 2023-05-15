console.log("In client.js");
/* global variables */
const numberRegExp = RegExp(/^[+−\-]?\d+(\.\d+)?/);
const operationRegExp = RegExp(/^[+−×÷\-\*\/]?/);
const operationSymbol = {
  "+": "+",
  "−": "−",
  "×": "×",
  "÷": "÷",
  "-": "−",
  "*": "×",
  "/": "÷",
};

/* functions */
const parseNext = (regex, string, startIndex) => {
  // do the parsing, starting from the current startIndex
  const execReturn = regex.exec(string.slice(startIndex));
  // if nothing was found, execReturn is null, which is falsey
  if (!execReturn) {
    return null;
  }
  // otherwise, extract the match and update the startIndex
  return execReturn[0];
};

const submitCalcForm = (event) => {
  event.preventDefault();
  /* step 1: parse the input line, getting the pair of numbers and the operator */
  let parseIndex = 0;
  const inputLine = document.querySelector("#calc-input-line").value;
  let numbers = [];
  let operations = [];
  do {
    if (parseIndex > 0) {
      // If past first number, parse the operation before parsing another
      const operation = parseNext(operationRegExp, inputLine, parseIndex);
      // Break if nothing was found
      if (!operation) { break; }
      // Increment the parse index
      parseIndex += operation.length; // currently always 1
      // Add to operations list, standardizing the operation symbol
      operations.push(operationSymbol[operation]);
    }
    // Parse the next number
    const number = parseNext(numberRegExp, inputLine, parseIndex);
    // Break if nothing was found
    if (!number) { break; }
    // Increment the parse index
    parseIndex += number.length;
    // Add to numbers list
    numbers.push(number);
  } while (parseIndex < inputLine.length);

  // If we didn't reach the end of the string, raise an alert
  if (parseIndex < inputLine.length) {
    alert(`Failed to interpret input after the ${parseIndex}th character`);
  // Otherwise, proceed as normal...
  } else {
    console.log("Numbers:", numbers);
    console.log("Operations:", operations);
    /* step 2: send this information to the server with a POST request */
  }
};
