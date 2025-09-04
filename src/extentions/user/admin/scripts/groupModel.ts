'use server'

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GroupInfo = async ()=> {
  let response
  const groupList = await prisma.userGroup.findMany()
  if(groupList) {
    response = {
      success: true,
      type: "success",
      data: groupList
    }
  }else{
    response = {
      success: false,
      type: "error",
      message : '그룹정보가 없습니다.',
      data: {}
    }
  }
  return response
}