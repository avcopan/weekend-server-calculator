console.log("In client.js");

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
  historyDiv.innerHTML = '';
  for (let entry of calcResult.history) {
    historyDiv.innerHTML = 
      `<span class="history-input">${entry.input}</span>=` +
      `<span class="history-answer">${entry.answer}</span><br />` +
      historyDiv.innerHTML;
  }
};

getCalculationResult().then(updatePage);