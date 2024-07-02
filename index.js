import Respond from "./src/core/Respond.js";

/** @jsx Respond.createElement */
function Counter() {
  const [state, setState] = Respond.useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  )
}
const element = <Counter />
const container = document.getElementById("root")
Respond.render(element, container)