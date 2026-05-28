import FeatureIndexClient from "./_FeatureIndexClient";
import { readFeatureDocsNav } from "./_markdown";

const Page = () => {
  const featureLinks = [
    ...readFeatureDocsNav(),
    { href: "/features/components", title: "Components", desc: "Modal과 Dropdown 등 기본 컴포넌트 문서" },
  ];

  return <FeatureIndexClient featureLinks={featureLinks} />;
};

export default Page;
