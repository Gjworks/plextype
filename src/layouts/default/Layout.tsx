"use client";

import Header from "@layouts/default/Header";
import Footer from "@layouts/default/Footer";

const DefaultLayout = ({ children }) => {
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

export default DefaultLayout;
