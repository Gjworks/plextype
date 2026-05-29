import heroImage from "./_assets/conference-hero.png";
import workshopImage from "./_assets/conference-workshop.png";
import loungeImage from "./_assets/conference-lounge.png";

const topics = [
  {
    title: "Plextype",
    desc: "설치, 구조, 관리자 설정, extensions 기반 커스텀 흐름을 실제 사용 관점으로 설명합니다.",
  },
  {
    title: "Artificial Intelligence",
    desc: "문서 기반 Assistant와 로컬 AI를 서비스와 개발 과정에 연결하는 방향을 공유합니다.",
  },
  {
    title: "Codex Workflow",
    desc: "코어를 보호하면서 기능을 추가하기 위한 AGENTS.md, 규칙, 작업 순서를 다룹니다.",
  },
];

const schedule = [
  ["10:30", "올해 작업한 Gjworks와 Plextype 구조 정리"],
  ["11:30", "Plextype 설치와 확장 방식"],
  ["13:30", "AI Assistant와 Codex 개발 흐름"],
  ["15:00", "질문과 적용 사례 정리"],
];

const Page = () => {
  return (
    <main className="bg-white text-gray-900">
      <section className="mx-auto max-w-screen-2xl px-3 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
              GXDC 2026
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-gray-950 md:text-6xl">
              Gjworks Xeant Developer Conference
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500">
              올해 작업한 Plextype, 인공지능, Codex 개발 흐름을 사용자에게 설명하는 GXDC2026입니다.
              올해 행사는 천안에서 열립니다.
            </p>
          </div>
          <div className="grid gap-2 text-xs font-bold text-gray-600 sm:grid-cols-2 md:w-[360px]">
            <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
              2026.06.06 - 06.07
            </div>
            <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
              Cheonan
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100">
          <img src={heroImage.src} alt="GXDC2026 conference keynote" className="aspect-[16/7] w-full object-cover" />
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-screen-2xl gap-3 px-3 py-5 md:grid-cols-3">
          {topics.map((topic) => (
            <article key={topic.title} className="rounded-md border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500">
                Topic
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900">{topic.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{topic.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-screen-2xl gap-8 px-3 py-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
            Program
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-normal text-gray-950 md:text-4xl">
            실무 중심으로 짧고 명확하게
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500">
            대형 행사처럼 과장하지 않고, 실제로 Plextype를 받아서 쓰는 사람이 알아야 할 구조와
            AI/Codex 활용 흐름을 차분하게 정리합니다.
          </p>

          <div className="mt-7 overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100">
            {schedule.map(([time, title]) => (
              <div key={time} className="grid grid-cols-[76px_1fr] gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0">
                <div className="text-sm font-black text-gray-950">{time}</div>
                <div className="text-sm font-semibold text-gray-600">{title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100">
            <img src={workshopImage.src} alt="GXDC2026 workshop" className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="text-sm font-bold text-gray-900">Hands-on Session</div>
              <p className="mt-1 text-xs leading-5 text-gray-400">구조를 보고 직접 적용할 수 있는 방식으로 설명합니다.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm shadow-gray-100">
            <img src={loungeImage.src} alt="GXDC2026 demo lounge" className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="text-sm font-bold text-gray-900">Demo & Q&A</div>
              <p className="mt-1 text-xs leading-5 text-gray-400">Plextype 사용자가 궁금해할 운영 흐름을 함께 정리합니다.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
