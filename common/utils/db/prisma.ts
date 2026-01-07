import { PrismaClient, PermissionSubject, Prisma } from "@prisma/client"; // Prisma 추가

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
export { PermissionSubject, Prisma };