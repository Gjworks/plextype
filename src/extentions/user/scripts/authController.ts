"use server";

export const authController = async () => {};
//////////////////////////////////////// deplicated
// import { cookies, headers } from "next/headers";

// import { hashedPassword, verifyPassword } from "@plextype/utils/auth/password";

// import { decodeJwt } from 'jose';
// import { sign, verify, refresh, refreshVerify } from "@plextype/utils/auth/jwtAuth";
// import { getUser } from "@/extentions/user/scripts/userModel";

// import { PrismaClient } from "@prisma/client";

// export const signin = async (formData: FormData) => {
//   const prisma = new PrismaClient();

//   try {
//     const accountId = formData.get("accountId") as string;
//     const password = formData.get("password") as string;
//     console.log(accountId, password)
//     if (!accountId) {

//       const response = {
//         success: true,
//         type: "error",
//         element: "accountId",
//         message: "계정 아이디 (혹은 이메일)을 입력해주세요.",
//         data : {}
//       }
//       return response
//     }
//     if (!password) {
//       const response = {
//         success: true,
//         type: "error",
//         element: "password",
//         message: "비밀번호를 입력해주세요.",
//         data : {}
//       }
//       return response
//     }
//     try {
//       const userInfo = await prisma.user.findUnique({
//         where: { accountId: accountId },
//       });

//       if (userInfo! && (await verifyPassword(password, userInfo!.password))) {
//         // exclude password from json response
//         const tokenParams = {
//           id: userInfo!.id,
//           accountId:userInfo!.accountId,
//           isAdmin:userInfo!.isAdmin
//         }

//         let refreshToken
//         let accessToken
//         [accessToken, refreshToken] = await Promise.all([sign(tokenParams), refresh(tokenParams)])
//         console.log(accessToken)
//         const response =
//           {
//             success: true,
//             type: "success",
//             data: {
//               userInfo: userInfo
//             },
//             accessToken: accessToken,
//           }

//         cookies().set({
//           name: "accessToken",
//           value: accessToken,
//           httpOnly: true,
//           // secure: true,
//           sameSite: "strict",
//           // maxAge: 3600,
//         });
//         cookies().set({
//           name: "refreshToken",
//           value: refreshToken,
//           httpOnly: true,
//           // secure: true,
//           sameSite: "strict",
//           // maxAge: 3600 * 24 * 7,
//         });

//         return response;
//       } else {
//         const response =
//           {
//             success: false,
//             type: "error",
//             message : '아이디 혹은 비밀번호가 맞지 않거나 존재 하지 않은 계정입니다.',
//             data: {},
//             accessToken:null
//           }
//         return response;
//       }
//     } catch (e) {
//       console.error(e);
//       const response = {
//         success: false,
//         type: "error",
//         message: "아이디 혹은 비밀번호가 맞지 않거나 존재 하지 않은 계정입니다.",
//         data: {},
//         accessToken: null,
//       };
//       return response;
//     }
//     // return NextResponse.json({ code: "success" }, { status: 200 })
//   } catch (error) {
//     console.error(error);
//     return new Response("fail");
//   }
// }

// export const Refresh = async (token:string) => {
//   let newAccessToken: string
//   let verifyToken:any
//   const refreshToken = cookies().get('refreshToken')?.value
//   // const authorization = headers().get('authorization')
//   // const accessToken = authorization && authorization.split(' ')[1];
//   const accessToken = token

//   if (!accessToken && !refreshToken) {
//     return {
//       success: true,
//       code: "token_error",
//       type: "error",
//       message: "아이디 혹은 비밀번호가 맞지 않거나 존재 하지 않은 계정입니다.",
//       data: {},
//       accessToken:null
//     };
//   }

//   // accessToken이 유효한지 검사
//   try {
//     verifyToken = await verify(accessToken)

//     if (verifyToken.ok === false) {
//       const isLogged = getUser({})
//       if(!isLogged) {
//         cookies().delete('refreshToken');
//         cookies().delete('accessToken');
//         const response =
//           {
//             success: false,
//             code : 'user info not found',
//             type : 'error',
//             message: "회원정보를 찾을 수 없습니다.",
//             data : {},
//             accessToken: null,
//           }
//         return response
//       }
//       let refreshVerifyToken
//       if(refreshToken) {
//         refreshVerifyToken = await refreshVerify(refreshToken)
//       }

//       if(refreshVerifyToken) {

//         const decodeToken = await decodeJwt(accessToken);
//         if(decodeToken && decodeToken.id) {
//           const tokenParams = {
//             id: decodeToken.id,
//             userId : decodeToken.userId,
//             isAdmin:decodeToken.isAdmin
//           }
//           newAccessToken = await sign(tokenParams)
//           cookies().delete('accessToken');
//           cookies().set({
//             name: "accessToken",
//             value: newAccessToken,
//             httpOnly: true,
//             sameSite: "strict",
//           });
//           const response =
//             {
//               success: true,
//               code : 'new_accessToken',
//               type : 'success',
//               message: 'New accessToken',
//               data : {},
//               accessToken: newAccessToken,
//             }
//           return response
//         }
//       }else{
//         cookies().delete('refreshToken');
//         cookies().delete('accessToken');
//         const response =
//           {
//             success: false,
//             code : 'refreshToken_expires',
//             type : 'error',
//             message: "token이 만료되었습니다. 로그인을 새로 해주세요.",
//             data : {},
//             accessToken: null,
//           }
//         return response
//       }
//     }

//   // const refreshVerifyToken = refreshVerify(refreshToken)
//   return {
//     success: true,
//     code: "success",
//     message: "",
//     data: {},
//     accessToken:accessToken};
//   } catch (error) {
//     console.error(error);
//     throw { status: 500 };
//   }
// }

// export const Signout = async (token) => {
//   console.log('Signout')
//   cookies().delete('refreshToken');
//   cookies().delete('accessToken');

//   // const hasCookie = cookies().has('refreshToken')
//   const refreshToken = cookies().get('refreshToken')?.value
//   const accessToken = cookies().get('accessToken')?.value

//   try {
//     if(refreshToken && accessToken) {
//       const response = {
//         success: true,
//         message: "token이 만료되었습니다. 새로 로그인을 해주세요."
//       }
//       return response
//     }else{

//       // const response = NextResponse.json(
//       //   {
//       //     success: true,
//       //     message: "token이 만료되었습니다. 새로 로그인을 해주세요."
//       //   },
//       //   {
//       //     status: 200,
//       //     headers: { "content-type": "application/json" },
//       //   },
//       // );
//       const response = {
//         success: true,
//         message: "token이 만료되었습니다. 새로 로그인을 해주세요."
//       }

//       console.log('Signout response', response)
//       return response
//     }

//   } catch (error) {
//     console.error(error);
//     throw new Response("fail")
//   }
// }
