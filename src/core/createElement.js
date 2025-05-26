import createTextElement from "./createTextElement.js";

// creates an Element (text, or other), takes properties and (if any) children
export default function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => // it is text or an other type of element
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}


