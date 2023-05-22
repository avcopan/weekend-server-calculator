/* globals */
const calcInputLine = document.querySelector("#calc-input-line");
const properSymbol = {
  "-": "−",
  "*": "×",
  "/": "÷",
};

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
    event.target.value = event.target.value + properChar;
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
  answerValueElement.innerHTML = calcResult.answer;
  // Then, update the history div
  const historyDiv = document.querySelector("#history-div");
  historyDiv.innerHTML = "";
  for (let entry of calcResult.history) {
    historyDiv.innerHTML =
      `<span class="history-input">${entry.input} </span>=` +
      `<span class="history-answer"> ${entry.answer}</span><br />` +
      historyDiv.innerHTML;
  }
};

/* main */
calcInputLine.addEventListener("keydown", useProperMathSymbols);
getCalculationResult().then(updatePage);
