"use client";

import Header from "src/layouts/fullLayout/Header";
import Footer from "src/layouts/fullLayout/Footer";

const FullLayout = ({ children }) => {
  // useEffect(() => {
  //   const htmlElement = document.documentElement;
  //   if (!htmlElement.classList.contains("dark")) {
  //     htmlElement.classList.add("dark");
  //   }
  // }, []); // 빈 배열을 두 번째 인수로 전달하면 컴포넌트가 처음 마운트될 때만 실행됩니다.
  return (
    <>
      <Header />
      <main className="relative">{children}</main>
      <footer className="relative">
        <Footer />
      </footer>
    </>
  );
};

export default FullLayout;
