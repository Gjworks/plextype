"use client";

import DefaultNav from "@plextype/components/nav/DefaultNav";

export default function UserNavWrapper({ list }: { list: any[] }) {
  return (
    <div className="flex justify-center sticky top-0 w-full bg-white/90 dark:bg-dark-950/40 backdrop-blur-lg border-b border-gray-100 dark:border-dark-700">
      <DefaultNav list={list} />
    </div>
  );
}