"use server";

export const getCategories = async () => {
  return [
    {
      id: 1,
      name: "카테고리1",
    },
    {
      id: 2,
      name: "카테고리2",
    },
    {
      id: 3,
      name: "카테고리3",
    },
    {
      id: 4,
      name: "카테고리4",
    },
    {
      id: 5,
      name: "카테고리5",
    },
  ];
};

export const validateUserPermissions = async (
  mid: string,
  type: string,
  userInfo,
) => {
  // if (!mid) {
  //   return { error: 'Missing Module ID' ,  status: 400 };
  // }
  // const postInfo = await prisma.module.findUnique({where: { mid: mid }});
  // if (!postInfo) {
  //   return {
  //     success: false,
  //     errorCode: "MODULE_NOT_FOUND",
  //     message: "게시판 정보가 없습니다."
  //   }
  // }
  // const grantInfo = (postInfo?.config as { grant: any })?.grant;
  // if (grantInfo.listGrant && grantInfo.listGrant.length > 0) {
  //   if(grantInfo.listGrant.includes('member')) {
  //     if (!userInfo || userInfo === 'undefined') {
  //       return {
  //         success: false,
  //         errorCode: "INSUFFICIENT_PERMISSIONS",
  //         message: "권한이 없습니다."
  //       }
  //     }
  //   } else if(grantInfo.listGrant.includes('admin')) {
  //     if (!userInfo?.isAdmin) {
  //       return {
  //         success: false,
  //         errorCode: "INSUFFICIENT_PERMISSIONS",
  //         message: "관리자만 접근 가능합니다."
  //       }
  //     }
  //   //비회원일 경우
  //   } else if(grantInfo.listGrant.includes('guest')) {
  //   }else{
  //     if(userInfo && userInfo !== 'undefined') {
  //       const listGrantIds = grantInfo.listGrant.map((id) => parseInt(id, 10));
  //       const hasGrantPermission = userInfo.userGroups.some((group) => listGrantIds.includes(group.groupId));
  //       if(!hasGrantPermission) {
  //         return {
  //           success: false,
  //           errorCode: "INSUFFICIENT_PERMISSIONS",
  //           message: "접근 권한이 없습니다."
  //         }
  //       }else {
  //         return {
  //           success: true,
  //           message: ""
  //         }
  //       }
  //     }
  //   }
  // }
};
