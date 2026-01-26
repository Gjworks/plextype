"use client";

import Link from "next/link";
import Image from "next/image";

import { motion } from "framer-motion";
import React from "react";

const Page = () => {
  const parentVariants = {
    onscreen: {
      transition: { staggerChildren: 0.2 },
    },
    offscreen: {
      transition: { staggerChildren: 0.2, staggerDirection: -1 },
    },
  };
  const variants = {
    onscreen: {
      y: 0,
      opacity: [0, 1],
      transition: {
        duration: 0.4,
      },
    },
    offscreen: {
      y: 25,
      opacity: 0,
    },
  };
  return <></>;
};

export default Page;
