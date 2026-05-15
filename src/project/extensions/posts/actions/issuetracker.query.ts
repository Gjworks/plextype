import prisma from "@utils/db/prisma";

export async function findIssueDocumentForStatus(id: number) {
  return prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      userId: true,
      module: {
        select: {
          mid: true,
          config: true,
        },
      },
    },
  });
}

export async function updateIssueStatus(id: number, status: "open" | "closed") {
  return prisma.document.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      status: true,
    },
  });
}
