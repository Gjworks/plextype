'use client'
import {useRouter} from 'next/navigation'
import Accordion from "@/core/components/accordion/Accordion";

const Page = () => {
  const router = useRouter()
  const serviceItems = [
    {
      id: "ai-workflow",
      title: "최신 AI 워크플로우 설계 및 컨설팅",
      isOpen: true, // 기본으로 열려있게 설정 가능
      content: (
        <>
          <p>지제이웍스는 2018 년 처음시작한 웹과 앱을 개발하기 위한 소규모 개발팀입니다. 우리는 혁신적이고 미래 지향적 인 기업, 신생 기업 및 비즈니스와 협력하여 매력적인 제품을 연구하고 개발합니다.</p>

        </>
      ),
    },
    {
      id: "web-dev",
      title: "웹 개발",
      content: (
        <>
          <p>지제이웍스는 2018 년 처음시작한 웹과 앱을 개발하기 위한 소규모 개발팀입니다. 우리는 혁신적이고 미래 지향적 인 기업, 신생 기업 및 비즈니스와 협력하여 매력적인 제품을 연구하고 개발합니다.</p>

        </>
      ),
    },
  ];
  // router.push('/docs/documentation')
  return <>
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">서비스 역량</h2>
      <Accordion items={serviceItems} allowMultiple={false} />
    </div>
  </>
}

export default Page
