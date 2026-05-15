import type { PostSkinCapability } from "@/core/registry/defaultPostCapabilities";

export const postSkinCapabilities: Record<string, PostSkinCapability> = {
  issuetracker: {
    documentStatus: {
      defaultStatus: "open",
      useStatusCounts: true,
    },
  },
};
