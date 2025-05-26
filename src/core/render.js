import { createDom, updateDom } from "./createDom.js";
import * as state from "../global/state.js";

export default function render(element, container) {

  // this runs during browser idle periods (when browser not processing any tasks and watining for user input or new task)
  requestIdleCallback(workLoop)

  // this is the root of current work in progress fiber tree
  state.setWipRoot (
    {
      dom: container, // Dom node we append children to
      props: {
        children: [element], // the root element as only child
      },
      alternate: state.getCurrentRoot(), // previous fiber tree for diffing (checking what has changed)
    }
  )
  state.clearDeletions()
  state.setNextUnitOfWork(state.getWipRoot()) // setup nextunitofwork to the the root fiber
}

// If all units of work is done, commit to the changes to real DOM
function commitRoot() {
  state.getDeletions().forEach(commitWork)
  commitWork(state.getWipRoot().child)
  state.setCurrentRoot(state.getWipRoot())
  state.setWipRoot(null) // clear wip root
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) { 
    domParent.removeChild(fiber.dom) 
  } else {
    commitDeletion(fiber.child, domParent) // keep going through till DOM is found
  }
}



function commitWork(fiber) {
  if (!fiber) {
    return
  }

  // find nearest DOM node (not a function component)
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  // apply appropiate operation
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) { 
    domParent.appendChild(fiber.dom) 
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) { 
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent)
  }

  // continue doing this until all children/siblings are commited
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

// Main loop that breaks rending work into small units
function workLoop(deadline) {
  let shouldYield = false
  while (state.getNextUnitOfWork() && !shouldYield) {
    state.setNextUnitOfWork(performUnitOfWork(state.getNextUnitOfWork()))
    shouldYield = deadline.timeRemaining() < 1 // deadline is out, yield to browser
  }

  if (!state.getNextUnitOfWork() && state.getWipRoot()) { // when DONE! (No more unitofwork, but we hae a WIP root, commit it)
    commitRoot()
  }

  // Request the next idle callback
  requestIdleCallback(workLoop)
}

// Process functional component, set up hooks and reconcile its returned children
function updateFunctionComponent(fiber) {
  state.setWipFiber(fiber) // working on the functional component
  state.setHookIndex(0)
  state.setWipFiberHooks([])
  const children = [fiber.type(fiber.props)] // returns virtual element (js object)
  reconcileChildren(fiber, children) // reconcile children to fiber
}

// Process DOM element
function updateHostComponent(fiber) {
  if (!fiber.dom) { 
    fiber.dom = createDom(fiber) // first render (newly created fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

// Perform work for a single fiber and return next fiber that needs work
// This function is called by workLoop
function performUnitOfWork(fiber) {
  const isFunctionComponent =
    fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // If fiber has child, then that is the next fiber that needs work.
  // DFS algorithm. 
  if (fiber.child) {
    return fiber.child 
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

// Compare new elements to old fibers to decide the operation (DELETE, PLACEMENT, UPDATE)
function reconcileChildren(wFiber, elements) {
  let index = 0
  let oldFiber =
    wFiber.alternate && wFiber.alternate.child // old roots child?
  let prevSibling = null

  // Loop through all elements and any oldFiber
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null

    // Check if node can be reused
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    // Reuse the existing DOM node with new props
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    // create a new DOM node
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }

    // mark the the old fiber to be removed (element doesnt exists)
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      state.pushDeletion(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    
    if (index === 0) { // If its the first child of the wip fiber, assign to child
      wFiber.child = newFiber
    } else if (element) { // otherwise attach it as next sibling of the previous fiber at this level
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber // add its new siblings
    index++
  }
}
