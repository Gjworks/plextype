import Installer from "@/modules/installer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <Installer view={view || "catalog"} />;
}
