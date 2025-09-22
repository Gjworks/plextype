"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalPortal from "@plextype/components/modal/ModalPortal";

interface ModalProps {
  state: boolean;
  close: (state: boolean) => void;
  size?: string;
  position?: string;
  escClose?: boolean;
  overlay?: boolean;
  overlayClose?: boolean;
  children: React.ReactNode;
}

interface ModalPosition {
  y: string;
  iniY: string;
  pos: string;
}
const Modal: React.FC<ModalProps> = ({
  state,
  close,
  size = "md",
  position = "center",
  escClose = true,
  overlay = true,
  overlayClose = true,
  children,
}) => {
  const [modalState, setModalState] = useState(false);
  useEffect(() => {
    setModalState(state);
  }, [state]);

  let modalSize;
  switch (size) {
    case "sm":
      modalSize = "max-w-screen-sm";
      break;
    case "md":
      modalSize = "max-w-screen-md";
      break;
    case "lg":
      modalSize = "max-w-screen-lg";
      break;
    case "xl":
      modalSize = "max-w-screen-xl";
      break;
    case "2xl":
      modalSize = "max-w-screen-2xl";
      break;
    default:
      modalSize = "max-w-screen-md";
  }

  let modalPosition: ModalPosition = {
    y: "-50%",
    iniY: "-60%",
    pos: "top-1/2",
  };
  switch (position) {
    case "center":
      modalPosition = {
        y: "-50%",
        iniY: "-60%",
        pos: "top-1/2",
      };
      break;
    case "top":
      modalPosition = {
        y: "0%",
        iniY: "-10%",
        pos: "top-5",
      };
      break;
    case "bottom":
      modalPosition = {
        y: "0%",
        iniY: "40%",
        pos: "bottom-2",
      };
      break;
    default:
      break;
  }

  useEffect(() => {
    if (modalState === true) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [modalState]);

  const variants = {
    openModal: {
      opacity: 1,
      y: "0%",
      transition: { duration: 0.3 },
    },
    closeModal: {
      opacity: 0,
      y: "-10%",
      transition: { duration: 0.3 },
    },
  };
  const modalVariants = {
    openModal: {
      opacity: 1,
      y: modalPosition.y,
      x: "-50%",
      transition: { duration: 0.3 },
    },
    closeModal: {
      opacity: 0,
      y: modalPosition.y,
      transition: { duration: 0.3 },
    },
  };
  const exit = {
    opacity: 0,
    transition: { duration: 0.3 },
  };
  const handleCloseModal = () => {
    close(false);
  };
  const handleOverlayCloseModal = () => {
    overlayClose && close(false);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      escClose &&
        event.key === "Escape" &&
        // ESC 키를 눌렀을 때 실행할 함수 호출
        close(false);
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
        {state && (
          <>
            <ModalPortal>
              <motion.div
                initial={{ opacity: 0, y: modalPosition.iniY, x: "-50%" }}
                animate={modalState === true ? "openModal" : "closeModal"}
                variants={modalVariants}
                exit={exit}
                className={`bootom-1 z-101 dark:bg-dark-800/95 dark:border-dark-900/75 dark:border-t-dark-800 fixed left-1/2 ${modalPosition.pos} mx-auto mb-2 w-full ${modalSize} overflow-hidden rounded-xl bg-white  backdrop-blur-lg lg:mb-10 dark:border`}
              >
                <div className="" onClick={handleCloseModal}></div>
                <motion.div
                  initial={{ opacity: 0, y: "-10%" }}
                  animate={{
                    opacity: 1,
                    y: "0%",
                    transition: { duration: 0.5 },
                  }}
                  exit={{
                    opacity: 1,
                    y: "-10%",
                    transition: { duration: 0.5 },
                  }}
                  className="z-101"
                >
                  {children}
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={modalState === true ? "openModal" : "closeModal"}
                variants={variants}
                exit={exit}
                onClick={handleOverlayCloseModal}
                className="dark: z-100 fixed inset-0 bg-gray-950/70 dark:bg-dark-800/20 backdrop-blur"
              ></motion.div>
            </ModalPortal>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Modal;
