"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, Mail, PanelBottom, Search, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";

import Accordion from "@components/accordion/Accordion";
import Button from "@components/button/Button";
import Dropdown from "@components/dropdown/Dropdown";
import InputField from "@components/form/InputField";
import SelectField from "@components/form/SelectField";
import Alert from "@components/message/Alert";
import Modal, { useModal } from "@components/modal/Modal";

import { CodeBlock, DocLinkList, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../_components";

const componentItems = [
  {
    href: "/features/components#buttons",
    label: "Button",
    desc: "기본 액션, 로딩 상태, 아이콘 버튼, 전체 너비 버튼에 사용합니다.",
    meta: "@components/button/Button",
  },
  {
    href: "/features/components#forms",
    label: "InputField / SelectField",
    desc: "관리자 설정, 회원 등록, 게시글 작성에서 같은 입력 규칙과 fieldErrors 표시를 공유합니다.",
    meta: "@components/form",
  },
  {
    href: "/features/components/modal",
    label: "Modal",
    desc: "확인, 선택, 짧은 form 작업처럼 현재 화면 위에서 결정을 받아야 할 때 사용합니다.",
    meta: "/features/components/modal",
  },
  {
    href: "/features/components#bottom",
    label: "Bottom",
    desc: "문서 패널, 모바일 선택 UI, 긴 보조 화면을 아래에서 올리는 패널입니다.",
    meta: "@components/panel/Bottom",
  },
  {
    href: "/features/components#disclosure",
    label: "Accordion / Dropdown",
    desc: "정보를 접거나, 버튼 주변에 짧은 메뉴를 띄울 때 사용합니다.",
    meta: "@components/accordion, @components/dropdown",
  },
  {
    href: "/features/components#feedback",
    label: "Alert",
    desc: "fieldErrors로 표현하기 어려운 전역성 안내와 작업 결과 메시지에만 제한적으로 사용합니다.",
    meta: "@components/message/Alert",
  },
];

const componentPaths = [
  { path: "src/core/components/button/Button.tsx", desc: "공통 버튼입니다. `isLoading`, `icon`, `fullWidth`를 지원합니다." },
  { path: "src/core/components/form/InputField.tsx", desc: "label, icon, disabled, error 표시를 포함한 기본 input입니다." },
  { path: "src/core/components/form/SelectField.tsx", desc: "InputField와 같은 톤의 select 입력입니다." },
  { path: "src/core/components/modal/Modal.tsx", desc: "Portal 기반 modal입니다. 위치, 크기, overlay, ESC 정책을 제어합니다." },
  { path: "src/core/components/panel/Bottom.tsx", desc: "아래에서 올라오는 패널입니다. features 문서와 보조 작업 화면에서 사용합니다." },
  { path: "src/core/components/accordion/Accordion.tsx", desc: "FAQ, 설정 그룹, 문서 요약처럼 접을 수 있는 콘텐츠에 사용합니다." },
  { path: "src/core/components/dropdown/Dropdown.tsx", desc: "트리거 주변에 작은 메뉴를 absolute로 띄우는 래퍼입니다." },
];

const inputProps = [
  { path: "inputTitle", desc: "label 텍스트입니다. 화면에 label이 필요 없을 때는 `hideLabel`과 함께 씁니다." },
  { path: "name / id", desc: "form 전송과 접근성 연결에 사용합니다. 가능하면 둘 중 하나는 꼭 넣습니다." },
  { path: "icon", desc: "입력 목적을 빠르게 구분해야 할 때 lucide 아이콘을 전달합니다." },
  { path: "error", desc: "fieldErrors의 첫 번째 메시지를 넘겨 input 아래에 표시합니다." },
  { path: "getData", desc: "간단한 값 콜백이 필요할 때 사용합니다. react-hook-form이면 일반 `onChange`나 register를 우선합니다." },
];

const modalProps = [
  { path: "state / close", desc: "열림 상태와 닫기 함수를 부모가 관리합니다." },
  { path: "size", desc: "`sm`, `md`, `lg`, `xl`, `2xl` 중 선택합니다. 기본값은 `md`입니다." },
  { path: "position", desc: "`center`, `top`, `bottom`을 지원합니다." },
  { path: "escClose / overlayClose", desc: "작성 중인 form처럼 실수로 닫히면 안 되는 작업에서 false로 둡니다." },
];

const bottomRules = [
  { path: "closeHref", desc: "닫을 때 특정 주소로 이동해야 하면 지정합니다. 없으면 `router.back()`을 사용합니다." },
  { path: "drag down", desc: "아래로 120px 이상 끌거나 빠르게 아래로 튕기면 닫힙니다." },
  { path: "animation", desc: "`bottom` 위치값 대신 `translateY` 기반으로 움직여 Windows와 큰 화면에서 부하를 줄입니다." },
];

const accordionItems = [
  {
    id: "one",
    title: "여러 섹션을 동시에 열 수 있나요?",
    content: "`allowMultiple`을 true로 주면 여러 항목을 동시에 열 수 있습니다. 설정 문서나 FAQ에 적합합니다.",
    isOpen: true,
  },
  {
    id: "two",
    title: "내용은 문자열만 가능한가요?",
    content: "content는 ReactNode입니다. 텍스트, 링크, 간단한 UI 조합을 넣을 수 있습니다.",
  },
  {
    id: "three",
    title: "언제 Accordion을 쓰면 좋나요?",
    content: "처음부터 전부 보여주면 읽기 부담이 큰 보조 설명, 옵션 묶음, 정책 설명에 사용합니다.",
  },
];

const ModalContent = () => {
  const modal = useModal();

  return (
    <div className="grid gap-5 p-6">
      <div>
        <div className="text-base font-semibold text-gray-900 dark:text-white">Modal Preview</div>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-300">
          실제 기능에서는 내부에 `InputField`, `Button`, fieldErrors를 조합합니다.
        </p>
      </div>
      <div className="flex justify-end">
        <Button onClick={modal.close}>닫기</Button>
      </div>
    </div>
  );
};

const ComponentsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <FeatureDocPanel>
      <DocsShell
        title="Components"
        description="Plextype 코어 UI 컴포넌트의 역할, 사용 기준, 예제 코드를 한 곳에서 확인합니다."
      >
        <DocSection title="사용 원칙">
          <p>
            코어 컴포넌트는 화면의 톤을 맞추기 위한 기준입니다. 관리자 설정, 회원, 게시판, 댓글처럼 반복되는 업무 화면에서는
            임의의 button, input, fixed layer를 새로 만들기보다 이 컴포넌트를 먼저 사용합니다.
          </p>
          <DocLinkList items={componentItems} />
          <PathTable items={componentPaths} />
        </DocSection>

        <DocSection title="Button" id="buttons">
          <p>
            `Button`은 기본 액션에 사용합니다. 로딩, 아이콘, 전체 너비 상태를 props로 처리하므로 페이지마다 버튼 높이나
            disabled 스타일을 따로 맞출 필요가 없습니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={<Settings size={14} />}>기본 버튼</Button>
            <Button icon={<ShieldCheck size={14} />} className="bg-gray-900 text-white hover:bg-gray-700">
              저장
            </Button>
            <Button isLoading>저장 중</Button>
            <Button disabled>비활성</Button>
          </div>
          <CodeBlock>{`import Button from "@components/button/Button";

<Button icon={<Settings size={14} />}>기본 버튼</Button>
<Button isLoading>저장 중</Button>
<Button fullWidth>전체 너비</Button>`}</CodeBlock>
        </DocSection>

        <DocSection title="Form Fields" id="forms">
          <p>
            `InputField`와 `SelectField`는 label, focus, disabled, error 상태를 같은 구조로 보여줍니다.
            서버 액션에서 받은 `fieldErrors`는 Alert로 올리지 말고 해당 input의 `error`에 연결하는 것을 기본 규칙으로 둡니다.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <InputField inputTitle="이메일" name="email" placeholder="hello@example.com" icon={<Mail size={16} />} />
            <InputField inputTitle="비밀번호" name="password" type="password" placeholder="8자 이상" icon={<KeyRound size={16} />} error="비밀번호를 입력해주세요." />
            <SelectField
              inputTitle="게시판 타입"
              name="boardType"
              placeholder="게시판 타입 선택"
              options={[
                { id: "default", title: "기본 게시판" },
                { id: "issue", title: "이슈 트래커" },
              ]}
              icon={<SlidersHorizontal size={16} />}
            />
            <InputField inputTitle="검색어" name="keyword" placeholder="검색어 입력" icon={<Search size={16} />} disabled />
          </div>
          <PathTable items={inputProps} />
          <CodeBlock>{`<InputField
  inputTitle="이메일"
  name="email"
  placeholder="hello@example.com"
  icon={<Mail size={16} />}
  error={fieldErrors?.email?.[0]}
/>

<SelectField
  inputTitle="게시판 타입"
  name="boardType"
  options={[
    { id: "default", title: "기본 게시판" },
    { id: "issue", title: "이슈 트래커" },
  ]}
/>`}</CodeBlock>
        </DocSection>

        <DocSection title="Modal">
          <p>
            `Modal`은 삭제 확인, 그룹 추가, 첨부파일 선택처럼 페이지 맥락을 유지한 채 짧은 결정을 받아야 할 때 사용합니다.
            긴 문서나 화면 전환성 콘텐츠에는 `Bottom`이 더 적합합니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModalOpen(true)}>Modal 열기</Button>
            <Button onClick={() => setModalOpen(true)} className="bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900">
              상세 문서는 /features/components/modal
            </Button>
          </div>
          <PathTable items={modalProps} />
          <CodeBlock>{`const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Modal 열기</Button>
<Modal state={open} close={setOpen} size="md" position="center">
  <ModalContent />
</Modal>`}</CodeBlock>
        </DocSection>

        <DocSection title="Bottom" id="bottom">
          <p>
            `Bottom`은 아래에서 올라오는 보조 화면입니다. 현재 `/features` 문서도 Bottom으로 열립니다.
            상단 핸들이 있고, 아래로 끌어당기거나 빠르게 튕기면 닫힙니다.
          </p>
          <div className="rounded-md border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-900">
            <div className="border-b border-gray-100 p-5 dark:border-dark-800">
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-300/90 dark:bg-dark-700" />
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-900 dark:text-white">
                <PanelBottom size={17} />
                Bottom panel preview
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-300">
                실제 컴포넌트는 portal로 렌더링되며, 닫을 때 `closeHref`가 있으면 해당 주소로 이동합니다.
              </p>
            </div>
          </div>
          <PathTable items={bottomRules} />
          <CodeBlock>{`import Bottom from "@components/panel/Bottom";

const ManualPage = ({ children }: { children: React.ReactNode }) => {
  return <Bottom closeHref="/features">{children}</Bottom>;
};`}</CodeBlock>
        </DocSection>

        <DocSection title="Accordion / Dropdown" id="disclosure">
          <p>
            `Accordion`은 정보를 접어 읽기 부담을 줄일 때 사용합니다. `Dropdown`은 계정 메뉴, 빠른 액션, 필터 메뉴처럼
            버튼 주변에 짧은 선택지를 띄울 때 사용합니다.
          </p>
          <Accordion items={accordionItems} allowMultiple className="rounded-md border border-gray-200 px-4 dark:border-dark-800" />
          <div className="relative inline-flex w-fit">
            <Button icon={<ChevronDown size={14} />} onClick={() => setDropdownOpen((prev) => !prev)}>
              Dropdown
            </Button>
            <Dropdown state={dropdownOpen} close={setDropdownOpen} className="left-0 top-full mt-2">
              <div className="w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-xl shadow-gray-950/10 dark:border-dark-800 dark:bg-dark-900">
                {["프로필 보기", "알림 설정", "로그아웃"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
          <CodeBlock>{`<Accordion items={items} allowMultiple />

<div className="relative">
  <Button onClick={() => setOpen((prev) => !prev)}>메뉴</Button>
  <Dropdown state={open} close={setOpen} className="left-0 top-full mt-2">
    <div className="rounded-lg border bg-white p-2 shadow-xl">
      ...
    </div>
  </Dropdown>
</div>`}</CodeBlock>
        </DocSection>

        <DocSection title="Feedback" id="feedback">
          <p>
            `Alert`는 반드시 필요한 전역성 안내에만 씁니다. 입력값 오류는 `InputField`의 `error`로 내려보내고,
            작업 전체가 실패했거나 권한/시스템 문제처럼 특정 필드에 붙일 수 없는 경우에 Alert를 사용합니다.
          </p>
          <div className="grid gap-2">
            <Alert type="success" message="저장되었습니다." />
            <Alert type="warning" message="일부 설정은 서버 재시작 후 반영됩니다." />
            <Alert type="error" message="권한이 없거나 요청을 처리할 수 없습니다." />
          </div>
          <CodeBlock>{`<Alert type="success" message="저장되었습니다." />
<Alert type="warning" message="일부 설정은 서버 재시작 후 반영됩니다." />
<Alert type="error" message="권한이 없거나 요청을 처리할 수 없습니다." />`}</CodeBlock>
        </DocSection>
      </DocsShell>

      <Modal state={modalOpen} close={setModalOpen} size="md" position="center">
        <ModalContent />
      </Modal>
    </FeatureDocPanel>
  );
};

export default ComponentsPage;
