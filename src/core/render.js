import createDom from "./createDom";
import { isProperty } from "./createDom";

let nextUnitOfWork = null;
let wipRoot = null
let currentRoot = null
let deletions = null

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot,
    }
  nextUnitOfWork = wipRoot
  deletions = []
}

const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

//filter funcs
const isNew = (prev, next) => {
  return key => prev[key] != next[key]
}
const isGone = (prev, next) => {
  return key => !(key in next)
}
const isEvent = key => key.startsWith("on")
const isProp = key => key !== "children" && !isEvent(key)

const updateDom = (dom, prevProps, nextProps) => {
  //Remove old props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(key => 
      !(key in nextProps) || 
      isNew(prevProps, nextProps)
    )
    .forEach(name => {
      dom[name] = ""
    })

  //Set new or changed props
  Object.keys(prevProps)
  .filter(isProperty)
  .filter(isNew(prevProps, nextProps))
  .forEach(name => {
    const eventType = name.toLowerCase().substring(2)
    dom.removeEventListener(
      eventType,
      prevProps[name]
    )
    dom[name] = nextProps[name]
  })


  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  //Add eventlsitener
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

const commitDelation = (fiber, domParent) => {
  if(fiber.dom){
    domParent.removeChild(fiber.dom)
  }
  else {
    commitDelation(fiber.child, domParent)
  }
}

const commitWork = (fiber) => {
  if(!fiber){
    return
  }

  let domParentFiber = fiber.parent
  while(!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  const domParent = domParentFiber.dom

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } 

  else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } 

  else if (fiber.effectTag === "DELETION") {
    commitDelation(fiber, domParent)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const workLoop = (deadline) => {
  let shouldYield = false

  while(nextUnitOfWork && !shouldYield){
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = 1 > IdleDeadline.timeRemaining
  }

  if(!nextUnitOfWork && wipRoot){
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if(!fiber.dom){
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)
}

const performUnitOfWork = (fiber) => {


  const isFuncComp = fiber.type instanceof Function
  if(isFuncComp){
    updateFunctionComponent(fiber)
  }
  else {
    updateHostComponent(fiber)
  }


  

  if(fiber.child){
    return fiber.child
  }

  let nextFiber = fiber
  
  while(nextFiber) {
    if(nextFiber.sibling){
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

const reconcileChildren = (wipFiber, elements) => {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null


  while(index < elements.length || oldFiber != null){
    const element = elements[index]
    let newFiber = null

    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    if(sameType){
      newFiber = {
        type: oldFiber.type,
        props: oldFiber.props,
        dom: oldFiber.dom,
        parent: oldFiber.parent,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if(element && !sameType){
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if(oldFiber && !sameType){
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if(index === 0){
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

}


