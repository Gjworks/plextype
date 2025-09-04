import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
