'use client'

import React from 'react'
import { createPortal } from 'react-dom'

const BottomPortal = ({ children }) => {
  if (typeof window === 'undefined') return <></>
  const element = document.getElementById('bottom')
  return createPortal(children, element)
}

export default BottomPortal
