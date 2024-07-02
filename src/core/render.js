import { createDom, updateDom } from "./createDom.js";
import * as state from "../global/state.js";

export default function render(element, container) {

  requestIdleCallback(workLoop)

  state.setWipRoot (
    {
      dom: container,
      props: {
        children: [element],
      },
      alternate: state.getCurrentRoot(),
    }
  )
  state.clearDeletions()
  state.setNextUnitOfWork(state.getWipRoot())
}

function commitRoot() {
  state.getDeletions().forEach(commitWork)
  commitWork(state.getWipRoot().child)
  state.setCurrentRoot(state.getWipRoot())
  state.setWipRoot(null)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}



function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

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

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop(deadline) {
  let shouldYield = false
  while (state.getNextUnitOfWork() && !shouldYield) {
    state.setNextUnitOfWork(performUnitOfWork(state.getNextUnitOfWork()))
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!state.getNextUnitOfWork() && state.getWipRoot()) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

function updateFunctionComponent(fiber) {
  state.setWipFiber(fiber)
  state.setHookIndex(0)
  state.setWipFiberHooks([])
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}


function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}


function performUnitOfWork(fiber) {
  const isFunctionComponent =
    fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
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

function reconcileChildren(wFiber, elements) {
  let index = 0
  let oldFiber =
    wFiber.alternate && wFiber.alternate.child
  let prevSibling = null

  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null

    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

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
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      state.pushDeletion(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}
