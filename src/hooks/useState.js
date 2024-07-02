import * as state from "../global/state.js"

export default function useState(initial) {
  const wFiber = state.getWipFiber()
  const oldHook =
    wFiber.alternate &&
    wFiber.alternate.hooks &&
    wFiber.alternate.hooks[state.getHookIndex()]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    let cRoot = state.getCurrentRoot() 
    hook.queue.push(action)
    state.setWipRoot(
      {
        dom: cRoot.dom,
        props: cRoot.props,
        alternate: cRoot,
      }
    )
    state.setNextUnitOfWork(state.getWipRoot())
    state.clearDeletions()
  }

  state.pushWipFiberHooks(hook)
  state.setHookIndex(state.getHookIndex() + 1)
  return [hook.state, setState]
}