import Respond from "./src/core/Respond.js";

/** @jsx Respond.createElement */
function Counter() {
  const [state, setState] = Respond.useState(1);
  return Respond.createElement("h1", {
    onClick: () => setState(c => c + 1)
  }, "Count: ", state);
}
const element = Respond.createElement(Counter, null);
const container = document.getElementById("root");
Respond.render(element, container);
