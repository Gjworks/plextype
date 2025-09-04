import React from 'react'
import { createPortal } from 'react-dom'

const ModalPortal = ({ children }) => {
  if (typeof window === 'undefined') return <></>
  const element = document.getElementById('modal')
  return createPortal(children, element)
}

export default ModalPortal
