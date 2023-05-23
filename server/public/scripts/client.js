/* globals */
const calcInputLine = document.querySelector("#calc-input-line");
const properSymbol = {
  "-": "−",
  "*": "×",
  "/": "÷",
};
let historyIndex = -1;

/* functions */
/** An event listener to replace  -, *, and / with −, ×, and ÷
 *
 * Checks whether the pressed character matches one of these.  If so, prevents
 * the default behavior for the event and inserts the proper symbol in stead.
 *
 * @param {*} event
 */
const useProperMathSymbols = (event) => {
  const pressedChar = event.key;
  const properChar = properSymbol.hasOwnProperty(pressedChar)
    ? properSymbol[pressedChar]
    : pressedChar;
  if (pressedChar !== properChar) {
    event.preventDefault();
    // Get the current selection position
    currentPos = event.target.selectionStart;
    currentVal = event.target.value;
    event.target.value =
      currentVal.slice(0, currentPos) +
      properChar +
      currentVal.slice(currentPos);
    // Reset the new selection position
    event.target.setSelectionRange(currentPos + 1, currentPos + 1);
  }
};

/** Parse calculation input and send it to the server.
 *
 * @param {Event} event
 */
const postCalculationInput = (event) => {
  event.preventDefault();

  // Get and parse the input line
  const inputLine = document.querySelector("#calc-input-line").value;
  console.log("Received input line:", inputLine);

  // Post the calculation information to the server
  fetch("/calculation", {
    method: "POST",
    body: JSON.stringify({ inputLine: inputLine }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(() => {
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

/** Update the DOM with current calculation results
 *
 * @param {Object} calcResult - An object with two keys: `answer` gives the
 *  answer as a string; `history` gives the history as an array of objects, each
 */
const updatePage = (calcResult) => {
  console.log("calcResult", calcResult);
  // First, update the answer value
  const answerValueElement = document.querySelector("#answer-value");
  answerValueElement.innerHTML = calcResult.answer.replace('-', '−');
  // Next, report any errors
  if (calcResult.error) {
    alert(calcResult.error);
  }
  // Then, update the history div
  const historyDiv = document.querySelector("#history-div");
  historyDiv.innerHTML = "";
  for (let entry of calcResult.history) {
    historyDiv.innerHTML =
      `<span class="history-input">${entry.input} </span><span>=</span>` +
      `<span class="history-answer"> ${entry.answer}</span><br />` +
      historyDiv.innerHTML;
  }
  historyIndex = calcResult.history.length - 1;
  console.log('History index reset:', historyIndex);
};

const calcButtonPress = (event) => {
  event.preventDefault();
  let calcInputLine = document.querySelector('#calc-input-line');
  calcInputLine.value += event.target.innerHTML;
  console.log(event.target.innerHTML);
}

const scrollHistory = (calcResult) => {
  let calcInputLine = document.querySelector('#calc-input-line');
  if (historyIndex in calcResult.history) {
    const historyLine = calcResult.history[historyIndex].input;
    calcInputLine.value = historyLine.replace(/\s+/g, '');
  } else if (historyIndex >= calcResult.history.length) {
    historyIndex = calcResult.history.length - 1;
  }
}

const historyArrowUp = (event) => {
  event.preventDefault();
  if (historyIndex > 0) {
    historyIndex -= 1;
  }
  getCalculationResult().then(scrollHistory);
  console.log('History index decreased:', historyIndex);
}

const historyArrowDown = (event) => {
  event.preventDefault();
  historyIndex += 1;
  getCalculationResult().then(scrollHistory);
  console.log('History index increased:', historyIndex);
}

/* main */
calcInputLine.addEventListener("keydown", useProperMathSymbols);
getCalculationResult().then(updatePage);
