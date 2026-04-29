import { NextResponse, NextRequest } from "next/server";
import prisma from "@/core/utils/db/prisma";

export async function GET(request: NextRequest): Promise<Response> {
  const groups = await prisma.userGroup.findMany();
  return NextResponse.json(
    {
      success: true,
      type: "success",
      data: groups,
    },
    { status: 200 },
  );
}
