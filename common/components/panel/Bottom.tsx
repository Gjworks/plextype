"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BottomPortal from "@plextype/components/panel/BottomPortal";

const Bottom = ({ children }) => {
  const router = useRouter();
  const [panelState, setPanelState] = useState(false);
  const [state, setState] = useState(false);
  useEffect(() => {
    setPanelState(true);
  }, []);
  // useEffect(() => {
  //   if (panelState === true) {
  //     const $body = document.querySelector('body')
  //     const overflow = $body.style.overflow
  //     $body.style.overflow = 'hidden'
  //     return () => {
  //       $body.style.overflow = overflow
  //     }
  //   }
  // }, [panelState])
  useEffect(() => {
    if (panelState === true) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [panelState]);

  const variants = {
    openPanel: {
      bottom: "0%",
      transition: { duration: 0.3 },
    },
    closePanel: {
      bottom: "-100%",
      transition: { duration: 0.3 },
    },
  };
  const variants2 = {
    openPanel: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
    closePanel: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };
  const exit = {
    bottom: "-100%",
    transition: { duration: 0.5 },
  };
  const exit2 = {
    opacity: 0,
    transition: { duration: 0.5 },
  };
  const handleClosePanel = () => {
    // close(false)
    setPanelState(false);
    setTimeout(() => {
      router.back();
    }, 500);
  };
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape") {
        // ESC 키를 눌렀을 때 실행할 함수 호출
        setPanelState(false);
        setTimeout(() => {
          router.back();
        }, 500);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    // 컴포넌트가 언마운트될 때 이벤트 리스너를 정리
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []); // useEffect가 처음에 한 번만 호출되도록 빈 배열을 전달

  return (
    <>
      <AnimatePresence>
        {panelState && (
          <BottomPortal>
            {/* <motion.div
              onClick={handleClosePanel}
              className="fixed w-screen h-screen transform overflow-auto z-100 flex justify-center items-end px-1"
            > */}
            <motion.div
              initial={{ bottom: "-100%" }}
              animate={panelState === true ? "openPanel" : "closePanel"}
              variants={variants}
              exit={exit}
              className="bootom-1 z-101 fixed left-1/2 h-full w-full -translate-x-1/2"
            >
              <div className="relative flex h-10 w-full">
                <button
                  onClick={handleClosePanel}
                  className="z-101 absolute right-3 top-1 rounded-full p-2"
                >
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6 text-gray-100 dark:text-white "
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </span>
                </button>
              </div>
              <div className=" dark:bg-dark-950 dark:border-dark-800/75 dark:border-t-dark-600/50 mx-auto h-full w-full overflow-y-auto overflow-x-hidden rounded-t-xl bg-white shadow-md backdrop-blur-lg dark:border">
                {children}
              </div>
            </motion.div>
            {/* </motion.div> */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={panelState === true ? "openPanel" : "closePanel"}
              variants={variants2}
              exit={exit2}
              onClick={handleClosePanel}
              className="dark:bg-dark-800/70 z-90 fixed inset-0 bg-gray-950/70 backdrop-blur-sm"
            ></motion.div>
          </BottomPortal>
        )}
      </AnimatePresence>
    </>
  );
};
export default Bottom;
