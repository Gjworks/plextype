import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const favicon = await readFile(path.join(process.cwd(), "public", "favicon.ico"));

  return new NextResponse(favicon, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
