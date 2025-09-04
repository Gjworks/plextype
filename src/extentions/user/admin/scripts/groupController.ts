'use server'

import { PrismaClient } from "@prisma/client";
import { getUserSession } from "../../scripts/userModel";

const prisma = new PrismaClient();

export const upsertGroup = async (formData: FormData) => {

  const sessionInfo = await getUserSession()

  if(!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      code: "error",
      message : '권한이 없습니다.',
      data: {}
    }
  }

  const groupId = Number(formData.get("groupId") as string);
  const groupName = formData.get("groupName") as string;
  const groupTitle = formData.get("groupTitle") as string;
  const groupDesc = formData.get("groupDesc") as string;
  console.log(groupId, groupName, groupTitle, groupDesc)

  const userGroup = await prisma.userGroup.upsert({
    where: {
      id: groupId
    },
    update: {
      groupName: groupName,
      groupTitle: groupTitle,
      groupDesc: groupDesc
    },
    create: {
      groupName: groupName,
      groupTitle: groupTitle,
      groupDesc: groupDesc
    }
  })

  if(userGroup) {
    return {
      success: true,
      type: "success",
      message : '그룹이 성공적으로 저장되었습니다.',
      data: userGroup
    }
  }else{
    return {
      success: false,
      type: "error",
      message : '그룹 저장에 실패하였습니다.',
      data: {}
    }
  }




  // const userId = formData.get('userId') as string;
  // const password = formData.get('password') as string;
  // const nickName = formData.get('nickName') as string;
}

export const deleteGroup = async (groupId) => {
  const sessionInfo = await getUserSession()
  console.log(groupId)
  if(!sessionInfo?.data?.isAdmin) {
    return {
      success: false,
      code: "error",
      message : '권한이 없습니다.',
      data: {}
    }
  }
  try {
    const userGroup = await prisma.userGroup.delete({
      where: {
        id: groupId
      }
    })
    console.log(userGroup)
    if(userGroup) {
      return {
        success: true,
        type: "success",
        message : '그룹이 성공적으로 삭제되었습니다.',
        data: userGroup
      }
    }else{
      console.log(`Error deleting group:`)
      return {
        success: false,
        type: "error",
        message : '그룹 삭제에 실패하였습니다.',
        data: {}
      }
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      type: "error",
      message : '그룹 삭제에 실패하였습니다.',
      data: {}
    }
  }



  
}