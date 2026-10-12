import "server-only";
import prisma from "@/core/utils/db/prisma";
import { canReadDocument, getBoardViewer } from "@/modules/posts/actions/access";
import { isProtectedUpload, isPublicUpload } from "@extensions/serverIntegrations";
import { extractUploadPaths } from "./parser";

export async function canReadUpload(filePath: string, viewer: Awaited<ReturnType<typeof getBoardViewer>>) {
  // Packages always require the dedicated purchase/review download endpoint.
  if (await isProtectedUpload(filePath)) return false;
  if (viewer?.isAdmin) return true;
  const attachment = await prisma.attachment.findFirst({ where: { path: filePath }, select: { userId: true } });
  if (viewer?.id && attachment?.userId === viewer.id) return true;
  const setting = await prisma.appSetting.findFirst({ where: { isPublic: true, value: filePath }, select: { id: true } });
  if (setting) return true;
  if (!attachment?.userId) return false;
  const avatar = await prisma.profile.findFirst({ where: { userId: attachment.userId, profileImage: filePath }, select: { id: true } });
  if (avatar || await isPublicUpload(filePath, attachment.userId)) return true;
  // Only the uploader can publish a file: copying another user's URL never grants access.
  const documents = await prisma.document.findMany({
    where: { userId: attachment.userId, OR: [{ thumbnail: filePath }, { content: { contains: filePath } }] },
    select: { moduleId: true, userId: true, slug: true, isSecrets: true, authorPassword: true, published: true, thumbnail: true, content: true },
  });
  for (const document of documents) {
    if ((document.thumbnail === filePath || extractUploadPaths(document.content).includes(filePath)) && await canReadDocument(document, viewer)) return true;
  }
  const comments = await prisma.comment.findMany({
    where: { userId: attachment.userId, isDeleted: false, isSecret: false, content: { contains: filePath } },
    select: { content: true, document: { select: { moduleId: true, userId: true, slug: true, isSecrets: true, authorPassword: true, published: true } } },
  });
  for (const comment of comments) {
    if (extractUploadPaths(comment.content).includes(filePath) && await canReadDocument(comment.document, viewer)) return true;
  }
  return false;
}
