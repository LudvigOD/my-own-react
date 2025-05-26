import * as state from "../global/state.js"

export default function useState(initial) {
  const wFiber = state.getWipFiber()
  // get oldHook from alternate fiber of wFiber
  const oldHook =
    wFiber.alternate &&
    wFiber.alternate.hooks &&
    wFiber.alternate.hooks[state.getHookIndex()]
  // Init a new hook
  const hook = {
    state: oldHook ? oldHook.state : initial, // use old state (if any), else use initial arg
    queue: [],
  }


  // If there are previous actions queued up in oldHook, we need to traverse them
  // in order to get the new correct value when the fiber updates.
  const actions = oldHook ? oldHook.queue : [] 
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  // schecdule a re-render with the action added to the new hook queue. 
  // "Quit current work and restart from the current node with new updated states!!!" (;
  const setState = action => {
    let cRoot = state.getCurrentRoot() // current root for working subtree
    hook.queue.push(action)
    // Create a new wip root to trigger a re-render
    state.setWipRoot(
      {
        dom: cRoot.dom,
        props: cRoot.props,
        alternate: cRoot,
      }
    )
    // start work from the new root
    state.setNextUnitOfWork(state.getWipRoot())
    // restart
    state.clearDeletions()
  }

  // update hooks
  state.pushWipFiberHooks(hook)
  state.setHookIndex(state.getHookIndex() + 1) // Inc index to grab potential next hook state.
  return [hook.state, setState]
}
