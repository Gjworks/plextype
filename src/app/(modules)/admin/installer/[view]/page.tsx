import { notFound } from "next/navigation";
import Installer from "@/modules/installer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!["purchases", "installed", "connection"].includes(view)) notFound();
  return <Installer view={view} />;
}
