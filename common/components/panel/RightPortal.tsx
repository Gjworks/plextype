'use client'

import React from 'react'
import { createPortal } from 'react-dom'

const RightPortal = ({ children }) => {
  if (typeof window === 'undefined') return <></>
  const element = document.getElementById('right')
  return createPortal(children, element)
}

export default RightPortal
