export const dynamic = 'force-dynamic';
import React from "react";
import DefaultLayout from "@layouts/default/Layout";

export default async function PageLayout({
                                           children,

                                         }: {
  children: React.ReactNode
}) {


  return (
    <DefaultLayout>{children}</DefaultLayout>
  );
}