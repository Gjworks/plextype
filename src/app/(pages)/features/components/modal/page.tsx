"use client";

import { useState } from "react";

import Button from "@components/button/Button";
import Modal, { useModal } from "@components/modal/Modal";

import { CodeBlock, DocSection, DocsShell, FeatureDocPanel, PathTable } from "../../_components";

type ModalKey = "center" | "top" | "bottom" | "small" | "locked";

const modalPaths = [
  {
    path: "src/core/components/modal/Modal.tsx",
    desc: "모달의 상태, 위치, 크기, overlay, ESC 닫기 처리를 담당하는 실제 컴포넌트입니다.",
  },
  {
    path: "src/core/components/modal/ModalPortal.tsx",
    desc: "모달을 현재 컴포넌트 트리 밖의 portal 영역에 렌더링합니다.",
  },
];

const propRows = [
  { path: "state", desc: "모달을 열지 닫을지 결정하는 boolean 값입니다." },
  { path: "close", desc: "모달 내부 또는 overlay에서 닫기 상태를 부모로 전달하는 함수입니다." },
  { path: "size", desc: "`sm`, `md`, `lg`, `xl`, `2xl` 중 하나를 사용합니다. 기본값은 `md`입니다." },
  { path: "position", desc: "`center`, `top`, `bottom` 중 하나를 사용합니다. 기본값은 `center`입니다." },
  { path: "escClose", desc: "ESC 키로 닫을 수 있는지 결정합니다. 기본값은 `true`입니다." },
  { path: "overlay", desc: "어두운 배경 overlay를 표시할지 결정합니다. 기본값은 `true`입니다." },
  { path: "overlayClose", desc: "overlay 클릭으로 닫을 수 있는지 결정합니다. 기본값은 `true`입니다." },
];

const ModalBody = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const modal = useModal();

  return (
    <div className="grid gap-5 p-6">
      <div>
        <div className="text-base font-semibold text-gray-900 dark:text-white">{title}</div>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-dark-300">{children}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={modal.close}>닫기</Button>
      </div>
    </div>
  );
};

const ModalDocsPage = () => {
  const [openModal, setOpenModal] = useState<Record<ModalKey, boolean>>({
    center: false,
    top: false,
    bottom: false,
    small: false,
    locked: false,
  });

  const open = (key: ModalKey) => setOpenModal((prev) => ({ ...prev, [key]: true }));
  const close = (key: ModalKey) => (state: boolean) => {
    setOpenModal((prev) => ({ ...prev, [key]: state }));
  };

  return (
    <FeatureDocPanel>
      <DocsShell
        title="Modal"
        description="코어 모달 컴포넌트의 위치, 크기, 닫기 정책, 실제 사용 기준을 정리한 문서입니다."
      >
        <DocSection title="역할">
          <p>
            `Modal`은 화면 위에 임시 작업 흐름을 띄울 때 사용하는 공통 컴포넌트입니다. 삭제 확인, 그룹 추가,
            이미지 선택, 설정 저장 확인처럼 현재 페이지의 맥락은 유지하면서 사용자의 결정을 받아야 할 때
            사용합니다.
          </p>
          <p>
            페이지마다 독자적인 fixed layer를 만들면 overlay 색상, 닫기 방식, z-index, 스크롤 잠금이 서로
            달라집니다. 그래서 코어 모달을 기준으로 맞추고, 내부 내용만 각 기능에서 구성하는 것이 좋습니다.
          </p>
          <PathTable items={modalPaths} />
        </DocSection>

        <DocSection title="기본 사용">
          <p>
            모달은 부모 컴포넌트에서 열린 상태를 갖고, `close` 함수로 닫힌 상태를 다시 받습니다.
            내부 버튼에서 닫아야 할 때는 `useModal()`을 사용하면 props를 여러 단계로 넘기지 않아도 됩니다.
          </p>
          <CodeBlock>{`"use client";

import { useState } from "react";
import Button from "@components/button/Button";
import Modal, { useModal } from "@components/modal/Modal";

const ModalContent = () => {
  const modal = useModal();

  return (
    <div className="p-6">
      <button type="button" onClick={modal.close}>닫기</button>
    </div>
  );
};

const Example = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <Modal state={open} close={setOpen} size="md" position="center">
        <ModalContent />
      </Modal>
    </>
  );
};`}</CodeBlock>
        </DocSection>

        <DocSection title="위치와 크기">
          <p>
            `position`은 사용자의 시선과 작업 성격에 맞춰 선택합니다. 단순 확인은 `center`, 상단 알림성
            작업은 `top`, 모바일에서 아래에서 올라오는 선택 UI는 `bottom`이 어울립니다. 크기는 내부 콘텐츠
            양에 맞춰 최소한으로 잡는 편이 좋습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => open("center")}>Center</Button>
            <Button onClick={() => open("top")}>Top</Button>
            <Button onClick={() => open("bottom")}>Bottom</Button>
            <Button onClick={() => open("small")}>Small</Button>
          </div>
          <PathTable
            items={[
              { path: "position=\"center\"", desc: "가장 일반적인 확인, 입력, 선택 모달에 사용합니다." },
              { path: "position=\"top\"", desc: "상단에서 짧게 보여야 하는 안내성 모달에 사용합니다." },
              { path: "position=\"bottom\"", desc: "모바일 친화적인 선택 패널이나 첨부파일 선택 UI에 적합합니다." },
              { path: "size=\"sm\"", desc: "삭제 확인처럼 짧은 결정을 받을 때 적합합니다." },
              { path: "size=\"md\"", desc: "기본 크기입니다. 간단한 form이나 선택 목록에 적합합니다." },
              { path: "size=\"lg\" 이상", desc: "이미지 선택, 권한 설정처럼 내용이 많은 작업에 사용합니다." },
            ]}
          />
        </DocSection>

        <DocSection title="닫기 정책">
          <p>
            기본적으로 ESC와 overlay 클릭으로 닫을 수 있습니다. 하지만 저장 중인 form, 필수 입력이 있는
            관리자 작업, 실수로 닫히면 작성 내용이 사라지는 화면에서는 `overlayClose={false}` 또는
            `escClose={false}`를 고려해야 합니다.
          </p>
          <div>
            <Button onClick={() => open("locked")}>닫기 제한 예시</Button>
          </div>
          <CodeBlock>{`<Modal
  state={open}
  close={setOpen}
  size="md"
  position="center"
  escClose={false}
  overlayClose={false}
>
  <RequiredForm />
</Modal>`}</CodeBlock>
        </DocSection>

        <DocSection title="Props">
          <PathTable items={propRows} />
        </DocSection>

        <DocSection title="적용 기준">
          <p>
            모달 안에서도 버튼, 입력 필드, fieldErrors 표시 방식은 기존 공통 컴포넌트를 사용합니다.
            특히 관리자 그룹 추가처럼 validation 실패가 발생하는 화면은 목록에 Alert를 띄우기보다 모달 안의
            해당 input 바로 아래에 오류를 보여주는 편이 자연스럽습니다.
          </p>
          <p>
            내용이 길어지는 모달은 내부에 스크롤 가능한 영역과 하단 고정 버튼 영역을 분리해야 합니다.
            저장 버튼이 화면 밖으로 밀려나면 사용자가 작업을 끝낼 수 없기 때문입니다.
          </p>
        </DocSection>
      </DocsShell>

      <Modal state={openModal.center} close={close("center")} size="md" position="center">
        <ModalBody title="Center Modal">
          확인, 수정, 선택처럼 대부분의 일반 작업에 적합한 기본 위치입니다.
        </ModalBody>
      </Modal>

      <Modal state={openModal.top} close={close("top")} size="md" position="top">
        <ModalBody title="Top Modal">
          페이지 상단 맥락과 연결된 안내성 작업에 사용할 수 있습니다.
        </ModalBody>
      </Modal>

      <Modal state={openModal.bottom} close={close("bottom")} size="md" position="bottom">
        <ModalBody title="Bottom Modal">
          모바일에서 선택지를 고르거나 첨부파일을 고르는 흐름에 잘 어울립니다.
        </ModalBody>
      </Modal>

      <Modal state={openModal.small} close={close("small")} size="sm" position="center">
        <ModalBody title="Small Modal">
          삭제 확인처럼 짧고 명확한 결정을 받을 때 사용합니다.
        </ModalBody>
      </Modal>

      <Modal
        state={openModal.locked}
        close={close("locked")}
        size="md"
        position="center"
        escClose={false}
        overlayClose={false}
      >
        <ModalBody title="닫기 제한 예시">
          ESC와 overlay 클릭으로 닫히지 않습니다. 반드시 버튼을 눌러 닫아야 하는 작업에 사용합니다.
        </ModalBody>
      </Modal>
    </FeatureDocPanel>
  );
};

export default ModalDocsPage;
