import Header from "@extensions/layouts/default/Header";
import Footer from "@extensions/layouts/default/Footer";
import { getPublicSiteSettingsAction } from "@/modules/admin/actions/settings.action";
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
    siteSettingsResult,
    headerNavigationResult,
    footerNavigationResult,
    footerPartnersResult,
    footerDeveloperResult,
  ] = await Promise.all([
    getPublicSiteSettingsAction(),
    getPublicSiteNavigationAction("header-main"),
    getPublicSiteNavigationAction("footer"),
    getPublicSiteNavigationAction("footer-partners"),
    getPublicSiteNavigationAction("footer-developer"),
  ]);

  const resolvedSiteTitle = siteTitle === "지제이웍스" ? siteSettingsResult.data?.projectTitle || siteTitle : siteTitle;

  return (
    <>
      <Header
        siteUrl={siteUrl}
        siteTitle={resolvedSiteTitle}
        navigationItems={headerNavigationResult.data || []}
      />
      <main className="relative min-h-screen bg-white text-gray-950 dark:bg-dark-950 dark:text-dark-100">{children}</main>
      <footer className="relative bg-white dark:bg-dark-950">
        <Footer
          footerItems={footerNavigationResult.data || []}
          partnerItems={footerPartnersResult.data || []}
          developerItems={footerDeveloperResult.data || []}
          siteTitle={resolvedSiteTitle}
        />
      </footer>
    </>
  );
};

export default DefaultLayout;
