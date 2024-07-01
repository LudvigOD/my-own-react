export const isProperty = key => key !== "children"

export default function createDom(fiber){
  const dom = typeof fiber.type === "TEXT_ELEMENT" //creating an element that can be rendered in the actual DOM
    ? document.createTextNode("")
    : document.createElement(fiber.type)


  const isProperty = key => key !== "children"

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name =>{
      dom[name] = fiber.props[name]
    })
  
  return dom
}