import prisma, { Prisma } from "@/core/utils/db/prisma";

export async function findAdjacentPostsQuery(moduleId: number, slug: string, ownerId?: number) {
  const current = await prisma.document.findFirst({ where: { slug, moduleId, moduleType: "posts", ...(ownerId !== undefined ? { userId: ownerId } : {}) }, select: { id: true, createdAt: true } });
  if (!current) return { previous: null, next: null };
  const scope: Prisma.DocumentWhereInput = { moduleId, moduleType: "posts", OR: [{ isSecrets: false }, { isSecrets: null }], ...(ownerId !== undefined ? { userId: ownerId } : {}) };
  // The ID breaks ties when two posts share the same creation timestamp.
  const find = (direction: "lt" | "gt") => prisma.document.findFirst({
    where: { AND: [scope, { OR: [{ createdAt: { [direction]: current.createdAt } }, { createdAt: current.createdAt, id: { [direction]: current.id } }] }] },
    orderBy: [{ createdAt: direction === "lt" ? "desc" : "asc" }, { id: direction === "lt" ? "desc" : "asc" }],
    select: { slug: true, title: true },
  });
  const [previous, next] = await Promise.all([find("lt"), find("gt")]);
  return { previous, next };
}
