"use server"

import prisma from "@plextype/utils/db/prisma";

/**
 * 단일 게시글 조회
 * @param id 게시글 ID
 */
export async function getPost(id: number) {
    try {
        const post = await prisma.document.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        nickName: true,
                    },
                },
            },
        });

        return post;
    } catch (err) {
        console.error("getPost 에러:", err);
        throw new Error("게시글을 불러올 수 없습니다.");
    }
}