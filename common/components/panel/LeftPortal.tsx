'use client'

import React from 'react'
import { createPortal } from 'react-dom'

const LeftPortal = ({ children }) => {
  // const [element, setElement] = useState()
  // if (typeof window === 'undefined') return <></>;
  // useEffect(() => {
  //   // setElement(document.getElementById('portal'));
  //   setElement(document.getElementById("left"))
  // }, []);
  // if (!element) {
  //   return <></>;
  // }

  // return createPortal(children, element)
  if (typeof window === 'undefined') return <></>
  const element = document.getElementById('left')
  return createPortal(children, element)
}

export default LeftPortal
