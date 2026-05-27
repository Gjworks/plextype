import Header from "@extensions/layouts/default/Header";
import Footer from "@extensions/layouts/default/Footer";
import { getPublicSiteNavigationAction } from "@/modules/admin/actions/sitemap.action";

const DefaultLayout = async ({
  children,
  siteUrl = "/",
  siteTitle = "지제이웍스",
}: {
  children: React.ReactNode;
  siteUrl?: string;
  siteTitle?: string;
}) => {
  // useEffect(() => {
  //   const htmlElement = document.documentElement;
  //   if (!htmlElement.classList.contains("dark")) {
  //     htmlElement.classList.add("dark");
  //   }
  // }, []); // 빈 배열을 두 번째 인수로 전달하면 컴포넌트가 처음 마운트될 때만 실행됩니다.
  const [
    headerNavigationResult,
    footerNavigationResult,
    footerPartnersResult,
    footerDeveloperResult,
  ] = await Promise.all([
    getPublicSiteNavigationAction("header-main"),
    getPublicSiteNavigationAction("footer"),
    getPublicSiteNavigationAction("footer-partners"),
    getPublicSiteNavigationAction("footer-developer"),
  ]);

  return (
    <>
      <Header
        siteUrl={siteUrl}
        siteTitle={siteTitle}
        navigationItems={headerNavigationResult.data || []}
      />
      <main className="relative">{children}</main>
      <footer className="relative">
        <Footer
          footerItems={footerNavigationResult.data || []}
          partnerItems={footerPartnersResult.data || []}
          developerItems={footerDeveloperResult.data || []}
          siteTitle={siteTitle}
        />
      </footer>
    </>
  );
};

export default DefaultLayout;
