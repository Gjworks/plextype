"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Dropdown = ({ state, close, children }) => {
  const [dropdownState, setDropdownState] = useState(false);

  const handleClickOutside = () => {
    close(false);
    setDropdownState(false);
  };
  // const { mid } = router?.query;
  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    setDropdownState(state);
  }, [state]);
  const initial = {
    opacity: 0,
  };

  const variants = {
    open: {
      opacity: 1,
      y: 0,
      display: "block",
      transition: {
        duration: 0.3,
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
    close: {
      opacity: 0,
      y: "15%",
      transitionEnd: {
        display: "none",
      },
    },
  };
  return (
    <>
      <motion.div
        initial={initial}
        animate={dropdownState === true ? "open" : "close"}
        variants={variants}
        transition={{ duration: 0.5 }}
        className={
          "dark:bg-dark-950/75 dark:border-dark-300/10 shadow-xs absolute right-0 top-10 z-[101] mt-2 overflow-hidden rounded-md border border-gray-200 bg-white/90 p-2 shadow-lg shadow-gray-950/10 backdrop-blur-lg dark:shadow-black/50 dark:backdrop-blur-lg"
        }
      >
        <div className="relative z-[100]">{children}</div>
      </motion.div>
    </>
  );
};

export default Dropdown;
