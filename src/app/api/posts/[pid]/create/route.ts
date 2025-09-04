import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { decodeJwt } from "jose";
import { getAuthenticatedUser } from "@/extentions/posts/scripts/authenticateUser";

const prisma = new PrismaClient();

type Params = Promise<{ pid: string }>;

export async function GET(
  request: Request,
  segmentData: { params: Params },
): Promise<Response> {
  let response = {};
  const { pid } = await segmentData.params;

  if (!pid) {
    return NextResponse.json({ error: "Missing Post ID" }, { status: 400 });
  }
  const postInfo = await prisma.posts.findUnique({ where: { pid: pid } });

  if (!postInfo) {
    response = {
      success: false,
      errorCode: "MODULE_NOT_FOUND",
      message: "게시판 정보가 없습니다.",
    };
    return NextResponse.json(response);
  }

  const userInfo = await getAuthenticatedUser(request);

  response = {
    success: true,
    errorCode: "",
    message: "",
    data: postInfo,
  };
  return NextResponse.json(response);
}

export async function POST(request: Request, segmentData: { params: Params }) {
  let response = {};
  // const { pid } = await segmentData.params;
  // const postData = await request.json();
  //
  // const userInfo = await getAuthenticatedUser(request);
  // console.log(userInfo);
  // const permissionsInfo = await validateUserPermissions(pid, "write", userInfo);
  // console.log(permissionsInfo);
  // // const postCreate = await createPost(postData, pid);
  // // console.log(" postCreate ", postCreate);
  //
  response = {
    success: true,
    errorCode: "",
    message: "",
  };

  return NextResponse.json(response);
}
