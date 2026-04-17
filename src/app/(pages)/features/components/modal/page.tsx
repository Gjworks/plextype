'use client'
import { useState } from 'react'
import Link from 'next/link'
import Codehighlighte from '@/core/components/codehighlight/Codehighlighter'

import Modal from '@/core/components/modal/Modal'

const Page = () => {
  const [showModalTop, setShowModalTop] = useState(false)
  const closeModalTop = close => {
    setShowModalTop(close)
  }

  const [showModalCenter, setShowModalCenter] = useState(false)
  const closeModalCenter = close => {
    setShowModalCenter(close)
  }

  const [showModalBottom, setShowModalBottom] = useState(false)
  const closeModalBottom = close => {
    setShowModalBottom(close)
  }

  const [showModalSm, setShowModalSm] = useState(false)
  const closeModalSm = close => {
    setShowModalSm(close)
  }

  const [showModalMd, setShowModalMd] = useState(false)
  const closeModalMd = close => {
    setShowModalMd(close)
  }

  const [showModalLg, setShowModalLg] = useState(false)
  const closeModalLg = close => {
    setShowModalLg(close)
  }

  const [showModalXl, setShowModalXl] = useState(false)
  const closeModalXl = close => {
    setShowModalXl(close)
  }

  const [showModal2Xl, setShowModal2Xl] = useState(false)
  const closeModal2Xl = close => {
    setShowModal2Xl(close)
  }

  const [showModalOverlay, setShowModalOverlay] = useState(false)
  const closeModalOverlay = close => {
    setShowModalOverlay(close)
  }

  const [showModalOverlayClose, setShowModalOverlayClose] = useState(false)
  const closeModalOverlayClose = close => {
    setShowModalOverlayClose(close)
  }

  const [showModalOverlayCloseFalse, setShowModalOverlayCloseFalse] =
    useState(false)
  const closeModalOverlayCloseFalse = close => {
    setShowModalOverlayCloseFalse(close)
  }

  const [showModalEscClose, setShowModalEscClose] = useState(false)
  const closeModalEscClose = close => {
    setShowModalEscClose(close)
  }

  const [showModalEscCloseFalse, setShowModalEscCloseFalse] = useState(false)
  const closeModalEscCloseFalse = close => {
    setShowModalEscCloseFalse(close)
  }

  const modalString = `import { useState } from 'react'
import Modal from 'src/core/components/modal/Modal'

const [showModal, setShowModal] = useState(false);
const closeModal = (close) => {
  setShowModal(close);
};

<button onClick={() => setShowModal(!showModal)}>
  Modal Button
</button>
<Modal 
  state={showModal}
  close={closeModal} 
  size="md" 
  position="center" 
  escClose={true}
  overlay={true}
  overlayClose={true}
  day="1" 
  desc"일동안 그만보기"
>
  // Child Components
</Modal>`

  return (
    <>
      <div className="">
        <div className="text-gray-950 text-2xl font-semibold mb-5">Modal</div>
        <div className="text-sm mb-5 text-gray-500">
          엘리먼트를 클릭시 위에서 아래 혹은 아래에서 위로 올라오는 레이어
          모달을 의미함.
        </div>
        <div className="mb-8">
          <Codehighlighte
            title="Modal Code Example"
            value={modalString}
            lang="jsx"
          />
        </div>
        <div className="text-gray-950 text-xl font-semibold mb-5">위치</div>
        <div className="text-sm mb-5 text-gray-500">
          모달의 위치를 정할 수 있습니다. top, center, bottom을 사용할 수
          있습니다.
        </div>
        <div className="mb-8 flex gap-4">
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalTop(!showModalTop)}
          >
            Top Modal
          </button>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalCenter(!showModalCenter)}
          >
            Center Modal
          </button>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalBottom(!showModalBottom)}
          >
            Bottom Modal
          </button>
        </div>
        <Modal
          state={showModalTop}
          close={closeModalTop}
          size="md"
          position="top"
        >
          <div className="p-20 text-center text-gray-950">Top 모달</div>
        </Modal>
        <Modal
          state={showModalCenter}
          close={closeModalCenter}
          size="md"
          position="center"
        >
          <div className="p-20 text-center text-gray-950">Center 모달</div>
        </Modal>
        <Modal
          state={showModalBottom}
          close={closeModalBottom}
          size="md"
          position="bottom"
        >
          <div className="p-20 text-center text-gray-950">Bottom 모달</div>
        </Modal>

        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-200">
                <th className="p-1 text-xs italic font-normal">name</th>
                <th className="p-1 text-xs italic font-normal">type</th>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">top</td>
                  <td className="py-2 px-3 text-sm text-gray-500">top-5</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">
                    center(기본값)
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-500">top:50</td>
                </tr>
                <tr className="">
                  <td className="py-2 px-3 text-sm text-gray-500">bottom</td>
                  <td className="py-2 px-3 text-sm text-gray-500">bottom-2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-gray-950 text-xl font-semibold mb-5">사이즈</div>
        <div className="text-sm mb-5 text-gray-500">
          모달의 사이즈를 정할 수 있습니다. sm, md, lg, xl, 2xl을 사용할 수
          있습니다.
        </div>
        <div className="mb-8 flex gap-4">
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalSm(!showModalSm)}
          >
            sm Modal
          </button>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalMd(!showModalMd)}
          >
            md Modal (기본값)
          </button>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalLg(!showModalLg)}
          >
            lg Modal
          </button>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalXl(!showModalXl)}
          >
            xl Modal
          </button>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModal2Xl(!showModal2Xl)}
          >
            2xl Modal
          </button>
        </div>
        <Modal
          state={showModalSm}
          close={closeModalSm}
          size="sm"
          position="center"
        >
          <div className="p-20 text-center text-gray-950">sm 모달</div>
        </Modal>
        <Modal
          state={showModalMd}
          close={closeModalMd}
          size="md"
          position="center"
        >
          <div className="p-20 text-center text-gray-950">md 모달</div>
        </Modal>
        <Modal
          state={showModalLg}
          close={closeModalLg}
          size="lg"
          position="center"
        >
          <div className="p-20 text-center text-gray-950">lg 모달</div>
        </Modal>
        <Modal
          state={showModalXl}
          close={closeModalXl}
          size="xl"
          position="center"
        >
          <div className="p-20 text-center text-gray-950">lg 모달</div>
        </Modal>
        <Modal
          state={showModal2Xl}
          close={closeModal2Xl}
          size="2xl"
          position="center"
        >
          <div className="p-20 text-center text-gray-950">lg 모달</div>
        </Modal>
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-200">
                <th className="p-1 text-xs italic font-normal">name</th>
                <th className="p-1 text-xs italic font-normal">type</th>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">sm</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    max-w-screen-sm
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">md</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    max-w-screen-md
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">lg</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    max-w-screen-lg
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">xl</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    max-w-screen-xl
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">2xl</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    max-w-screen-2xl
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-200">
                <th className="p-1 text-xs italic font-normal">name</th>
                <th className="p-1 text-xs italic font-normal">type</th>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">day</td>
                  <td className="py-2 px-3 text-sm text-gray-500">1, 7, 15</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">desc</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    일동안 그만 보기
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-gray-950 text-xl font-semibold mb-5">
            오버레이
          </div>
          <div className="text-sm mb-5 text-gray-500">
            오버레이를 사용할 수 있습니다.
          </div>
        </div>
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-200">
                <th className="p-1 text-xs italic font-normal">name</th>
                <th className="p-1 text-xs italic font-normal">type</th>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">overlay</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    true (기본값), false
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-gray-950 text-xl font-semibold mb-5">닫기</div>
          <div className="text-sm mb-5 text-gray-500">
            모달을 닫을 때 사용할 수 있는 방법입니다.
          </div>
        </div>
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-200">
                <th className="p-1 text-xs italic font-normal">name</th>
                <th className="p-1 text-xs italic font-normal">type</th>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">escClose</td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    true(기본값), false
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 text-sm text-gray-500">
                    overlayClose
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    true(기본값), false
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mb-8 flex gap-4">
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalEscClose(!showModalEscClose)}
          >
            escClose (true)
          </button>
          <Modal
            state={showModalEscClose}
            close={closeModalEscClose}
            size="md"
            position="center"
          >
            <div className="p-20 text-center text-gray-950">
              escClose (true)
            </div>
          </Modal>

          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalEscCloseFalse(!showModalEscCloseFalse)}
          >
            escClose (false)
          </button>
          <Modal
            state={showModalEscCloseFalse}
            close={closeModalEscCloseFalse}
            size="md"
            position="center"
            escClose={false}
          >
            <div className="p-20 text-center text-gray-950">
              escClose (false)<br></br>
              오버레이를 클릭하여 닫을 수 있습니다.
            </div>
          </Modal>

          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() => setShowModalOverlayClose(!showModalOverlayClose)}
          >
            오버레이 닫기 (true)
          </button>
          <Modal
            state={showModalOverlayClose}
            close={closeModalOverlayClose}
            size="md"
            position="center"
          >
            <div className="p-20 text-center text-gray-950">
              오버레이 닫기 (true)
            </div>
          </Modal>
          <button
            className="bg-white p-2 px-5 border border-gray-200 hover:bg-gray-50 shadow-sm text-sm rounded-md outline-none hover:border-gray-300"
            onClick={() =>
              setShowModalOverlayCloseFalse(!showModalOverlayCloseFalse)
            }
          >
            오버레이 닫기 (true)
          </button>
          <Modal
            state={showModalOverlayCloseFalse}
            close={closeModalOverlayCloseFalse}
            size="md"
            position="center"
            escClose={true}
            overlayClose={false}
          >
            <div className="p-20 text-center text-gray-950">
              오버레이 닫기 (false) <br></br>
              ESC 키를 눌러 닫을 수 있습니다.
            </div>
          </Modal>
        </div>
        <div className="mb-8">
          <div className="text-gray-950 text-xl font-semibold mb-5">
            닫기 커스텀
          </div>
          <div className="text-sm mb-5 text-gray-500">
            모달 버튼을 직접 지정하여 모달을 닫을 수 있습니다.
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
