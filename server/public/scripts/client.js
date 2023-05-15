console.log("In client.js");
// globals
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
    return null;
  }
  // otherwise, extract the match and update the startIndex
  return execReturn[0];
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
  do {
    if (parseIndex > 0) {
      // If past first number, parse the operation before parsing another
      const operation = parseNext(operationRegExp, inputLine, parseIndex);
      // Break if nothing was found
      if (!operation) {
        break;
      }
      // Increment the parse index
      parseIndex += operation.length; // currently always 1
      // Add to operations list, standardizing the operation symbol
      calcArray.push(operationSymbol[operation]);
    }
    // Parse the next number
    const number = parseNext(numberRegExp, inputLine, parseIndex);
    // Break if nothing was found
    if (!number) {
      break;
    }
    // Increment the parse index
    parseIndex += number.length;
    // Add to numbers list
    calcArray.push(number);
  } while (parseIndex < inputLine.length);

  // If we didn't reach the end of the string, raise an alert and quit the function
  if (parseIndex < inputLine.length) {
    alert(`Failed to interpret input after the ${parseIndex}th character`);
    return null;
  }

  return calcArray;
};

/** Parse calculation input and send it to the server.
 *
 * @param {Event} event
 */
const postCalculation = (event) => {
  event.preventDefault();

  // Get and parse the input line
  const inputLine = document.querySelector("#calc-input-line").value;
  const calcArray = parseCalculationInput(inputLine);

  // Post the calculation information to the server
  fetch("/calculation", {
    method: "POST",
    body: JSON.stringify(calcArray),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(() => {
    document.querySelector("#calc-form").reset();
    getCalculationResult().then(updatePage);
  });
};

/** Get the calculation answer from the server
 *
 * @returns {number} The answer of the most recent calculation.
 */
const getCalculationResult = async () => {
  return fetch("/calculation").then((res) => res.json());
};


const updatePage = (calcResult) => {
  console.log('calcResult', calcResult);
  const answerElement = document.querySelector('#answer-value');
  answerElement.innerHTML = calcResult.answer;
}