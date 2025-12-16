"use server";

import prisma from "@plextype/utils/db/prisma";
import {cookies} from "next/headers";
import {decodeJwt} from "jose";


export async function getMyFiles(page: number = 1) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) throw new Error("로그인 필요");

  const decoded = decodeJwt(accessToken) as { id: number; isAdmin: boolean } | null;
  if (!decoded) throw new Error("잘못된 토큰");

  const userId = decoded.id;

  const totalCount = await prisma.attachment.count({
    where: {
      userId : userId
    },
  });

  const pageSize = 10
  console.log('totalCount' + totalCount)
  const attachments = await prisma.attachment.findMany({
    where: {
      userId : userId,
      tempId: null
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      fileName: true,
      originalName : true,
      mimeType : true,
      size : true,
      path :  true,
    },
  });

  return {
    items : attachments,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };

}