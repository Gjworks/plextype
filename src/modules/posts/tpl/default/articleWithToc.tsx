"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Entry = { id: string; title: string; level: number };

export default function ArticleWithToc({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const tocScroll = useRef<HTMLDivElement>(null);
  const prefix = `article-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const container = tocScroll.current;
    const item = container?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!container || !item || !container.clientHeight) return;
    const bounds = container.getBoundingClientRect();
    const target = item.getBoundingClientRect();
    if (target.top < bounds.top) container.scrollTop += target.top - bounds.top;
    else if (target.bottom > bounds.bottom) container.scrollTop += target.bottom - bounds.bottom;
  }, [active]);

  useEffect(() => {
    if (!enabled || !root.current) return;
    const container = root.current;
    let headings: HTMLElement[] = [];
    let frame = 0;
    const originals = new Map<HTMLElement, { id: string; margin: string }>();
    const updateActive = () => {
      frame = 0;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 140) current = heading;
        else break;
      }
      setActive(current?.id || "");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(updateActive); };
    const collect = () => {
      headings = Array.from(container.querySelectorAll<HTMLElement>(".postContent h2, .postContent h3")).filter(heading => heading.textContent?.trim());
      headings.forEach((heading, index) => {
        if (!originals.has(heading)) originals.set(heading, { id: heading.id, margin: heading.style.scrollMarginTop });
        if (!heading.id || document.getElementById(heading.id) !== heading) heading.id = `${prefix}-${index}`;
        heading.style.scrollMarginTop = "120px";
      });
      setEntries(headings.map(heading => ({ id: heading.id, title: heading.textContent!.trim(), level: Number(heading.tagName.slice(1)) })));
      schedule();
    };
    collect();
    const mutations = new MutationObserver(collect);
    mutations.observe(container, { childList: true, subtree: true, characterData: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(container);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      mutations.disconnect(); resize.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      originals.forEach((original, heading) => { heading.id = original.id; heading.style.scrollMarginTop = original.margin; });
    };
  }, [enabled, prefix]);

  const links = (items: Entry[]) => <nav aria-label="본문 목차" className="border-l border-gray-200 dark:border-dark-800">
    {items.map(entry => <a key={entry.id} href={`#${encodeURIComponent(entry.id)}`} title={entry.title} aria-current={active === entry.id ? "location" : undefined}
      onClick={event => {
        const heading = root.current?.querySelector<HTMLElement>(`[id="${CSS.escape(entry.id)}"]`);
        if (!heading) return;
        event.preventDefault();
        history.replaceState(history.state, "", `#${encodeURIComponent(entry.id)}`);
        heading.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
        setActive(entry.id);
      }}
      style={active === entry.id ? { backgroundImage: "linear-gradient(currentColor, currentColor)", backgroundSize: "1px 20px", backgroundPosition: "left 12px", backgroundRepeat: "no-repeat" } : undefined}
      className={`-ml-px block break-words py-2.5 pr-2 text-[13px] leading-6 transition-colors ${entry.level === 3 ? "pl-8" : "pl-5"} ${active === entry.id ? "font-medium text-gray-950 dark:text-dark-100" : "text-gray-500 hover:text-gray-950 dark:text-dark-400 dark:hover:text-dark-100"}`}>
      <span className="line-clamp-2">{entry.title}</span></a>)}
  </nav>;
  const visible = enabled && entries.length > 0;
  return <div className={visible ? "grid w-full min-w-0 grid-cols-1 gap-x-10 xl:mx-auto xl:max-w-[1028px] xl:grid-cols-[minmax(0,768px)_220px]" : "w-full min-w-0"}>
    <div ref={root} className="min-w-0">{children}</div>
    {visible && <aside className="order-first px-3 xl:order-last xl:px-0">
      <div className="sticky top-28 hidden xl:block">
        <p className="mb-3 pl-5 text-[11px] font-semibold text-gray-400 dark:text-dark-500">ON THIS PAGE</p>
        <div ref={tocScroll} tabIndex={0} role="region" aria-label="스크롤 가능한 본문 목차" className="max-h-[calc(100svh-11rem)] overflow-y-auto overscroll-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-primary-500">
          {links(entries)}
        </div>
      </div>
      <details className="border-y border-gray-200 py-3 dark:border-dark-800 xl:hidden"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-gray-600 dark:text-dark-300">이 글의 목차<ChevronDown size={15} /></summary><div className="mt-3">{links(entries)}</div></details>
    </aside>}
  </div>;
}
