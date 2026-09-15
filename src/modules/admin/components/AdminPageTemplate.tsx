import type { ReactNode } from "react";
import Link from "next/link";

type AdminPageProps = {
  icon?: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tabs?: Array<{ label: string; href: string }>;
  activeHref?: string;
  children: ReactNode;
};

type AdminStat = {
  label: string;
  value: string | number;
  caption?: string;
  icon?: ReactNode;
};

export const adminInputClass =
  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-gray-300 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-100 dark:placeholder:text-dark-600 dark:focus:border-dark-700";

export const adminTextareaClass =
  "w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-3 text-sm font-medium leading-6 text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-gray-300 dark:border-dark-800 dark:bg-dark-950 dark:text-dark-100 dark:placeholder:text-dark-600 dark:focus:border-dark-700";

export const adminPrimaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-500/25 bg-white px-5 text-xs font-medium text-primary-600 ring-4 ring-primary-500/5 transition-all duration-200 hover:border-primary-500/30 hover:bg-primary-500/5 hover:text-primary-600 hover:ring-primary-500/10 active:bg-primary-500/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:ring-transparent dark:border-primary-400/25 dark:bg-dark-900 dark:text-primary-300 dark:ring-primary-400/10 dark:hover:bg-primary-400/10 dark:active:bg-primary-400/15 dark:disabled:border-dark-800 dark:disabled:text-dark-600";

export const adminDarkButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-950 bg-gray-950 px-4 text-xs font-medium text-white ring-4 ring-gray-950/5 transition-all duration-200 hover:bg-gray-800 hover:ring-gray-950/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-300 dark:border-dark-100 dark:bg-dark-100 dark:text-gray-950 dark:ring-white/10 dark:hover:bg-white dark:hover:ring-white/15 dark:disabled:border-dark-800 dark:disabled:bg-dark-800 dark:disabled:text-dark-600";

export const adminGhostButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35";

export const adminDangerButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-white px-4 text-xs font-medium text-red-500 transition-all duration-200 hover:bg-red-500/5 hover:text-red-500 hover:ring-4 hover:ring-red-100/70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/20 dark:bg-dark-900 dark:text-red-300 dark:hover:bg-red-400/10 dark:hover:ring-red-400/10";

export const AdminPage = ({
  icon,
  eyebrow,
  title,
  description,
  action,
  tabs,
  activeHref,
  children,
}: AdminPageProps) => {
  const headerContent = (
    <>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
          {icon}
          {eyebrow}
        </div>
        <div className="mt-2 text-lg font-semibold text-gray-700 dark:text-dark-100">{title}</div>
        {description && <div className="mt-1 text-sm text-gray-400">{description}</div>}
      </div>
      {action}
    </>
  );

  if (tabs?.length) {
    return (
      <div className="mx-auto max-w-screen-2xl px-3 pb-12">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
          <div className="border-b border-gray-100 px-5 dark:border-dark-800 md:px-6">
            <nav className="flex items-center gap-6 overflow-x-auto scrollbar-hide md:gap-8">
              {tabs.map((tab) => {
                const active = tab.href === activeHref;

                return (
                  <Link key={tab.href} href={tab.href} className="relative shrink-0 py-4">
                    <span className={`text-[13px] font-bold transition-colors ${active ? "text-primary-600 dark:text-primary-300" : "text-gray-400 hover:text-gray-900 dark:text-dark-500 dark:hover:text-dark-100"}`}>
                      {tab.label}
                    </span>
                    {active && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-primary-600 dark:bg-primary-300" />}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-col gap-4 px-5 py-6 xl:flex-row xl:items-end xl:justify-between">
            {headerContent}
          </div>
        </section>
        <div className="mt-6 space-y-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-3 pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">{headerContent}</div>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export const AdminStatGrid = ({ items }: { items: AdminStat[] }) => (
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-950">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
            {item.icon}
          </div>
          {item.caption && <span className="text-[11px] font-medium text-gray-400 dark:text-dark-500">{item.caption}</span>}
        </div>
        <div className="mt-4 text-xs font-bold text-gray-400">{item.label}</div>
        <div className="mt-1 text-3xl font-semibold text-gray-950 dark:text-dark-100">{item.value}</div>
      </div>
    ))}
  </section>
);

export const AdminPanel = ({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
    {(title || description || action) && (
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-dark-800 dark:bg-dark-950/70">
        <div>
          {title && <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-100">{title}</h2>}
          {description && <p className="mt-1 text-xs text-gray-400 dark:text-dark-500">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const AdminInfoList = ({
  items,
}: {
  items: Array<{ title: string; description: string; icon?: ReactNode; href?: string }>;
}) => (
  <div className="divide-y divide-gray-100 dark:divide-dark-800">
    {items.map((item) => {
      const content = (
        <div className="flex gap-3 px-4 py-4 transition-colors hover:bg-gray-100/70 dark:hover:bg-white/[0.04]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-dark-300">
            {item.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">{item.title}</div>
            <p className="mt-1 text-xs leading-5 text-gray-400 dark:text-dark-500">{item.description}</p>
          </div>
        </div>
      );

      return item.href ? (
        <Link key={item.title} href={item.href} className="block">
          {content}
        </Link>
      ) : (
        <div key={item.title}>{content}</div>
      );
    })}
  </div>
);

export const AdminEmptyState = ({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="flex min-h-72 flex-col items-center justify-center text-center">
    <div className="text-gray-300 dark:text-dark-600">{icon}</div>
    <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-dark-100">{title}</div>
    {description && <p className="mt-2 text-xs font-medium text-gray-400 dark:text-dark-500">{description}</p>}
  </div>
);
