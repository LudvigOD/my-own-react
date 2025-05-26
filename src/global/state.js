/*
An element is basically just an JS object that holds info about 
a real HTML element.

A fiber is a wrapper for an element, with extra info about:
 - child and siblings (child = first fiber of children list, siblings = fibers on the same "layer"), 
 - effectTag: the operation that needs to be worked on
 - alternate: old fiber, if this is an update
 - dom: holds the real node, the "HTMLElement" (if it exists)
*/


// Global constants (:<
let wipFiber = null
let hookIndex = null
let wipRoot = null
let nextUnitOfWork = null;
let currentRoot = null
let deletions = null

// Setter functions
export function setWipFiber(value) {
  wipFiber = value;
}

export function pushWipFiberHooks(value) {
  wipFiber.hooks.push(value)
}

export function setWipFiberHooks(value) {
  wipFiber.hooks = value
}

export function setHookIndex(value) {
  hookIndex = value;
}

export function setWipRoot(value) {
  wipRoot = value;
}

export function setNextUnitOfWork(value) {
  nextUnitOfWork = value;
}

export function setCurrentRoot(value) {
  currentRoot = value;
}

export function pushDeletion(value) {
  deletions.push(value)
}

// Initialize deletions as an empty array
export function clearDeletions() {
  deletions = [];
}

//getter
export function getWipFiber() {
  return wipFiber;
}

export function getHookIndex() {
  return hookIndex;
}


export function getWipRoot() {
  return wipRoot;
}

export function getNextUnitOfWork() {
  return nextUnitOfWork;
}

export function getWipFiberHooks() {
  wipFiber.hooks
}

export function getCurrentRoot() {
  return currentRoot
}

export function getDeletions() {
  return deletions
}
