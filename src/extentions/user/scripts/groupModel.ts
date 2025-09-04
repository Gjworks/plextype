'use server'
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const updateGroup = async () => {
  
}

export const deleteGroup = async () => {
  
}

export const getGroupList = async () => {
  const groupList = await prisma.userGroup.findMany(
    {
      select : {
        id : true,
        groupTitle : true,
        groupDesc : true,
        groupName : true,
        createdAt : true,
        updatedAt : true,
      }
    }
  )

  return groupList
}

// export const getGroupNameById = async (groupName:string) => {
//   const groupInfo = await prisma.userGroup.findFirst({
//     where : {
//       groupName : groupName
//     }
//   })
//   return groupInfo;
// }