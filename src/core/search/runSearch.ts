import { searchProviders } from "./providers";
import type { SearchProviderKey, SearchResponse } from "./search.types";
import { getSearchSettingsRuntimeAction } from "@/modules/admin/actions/settings.action";

const normalizeQuery = (query: string) => query.replace(/\s+/g, " ").trim();

export async function runIntegratedSearch({
  query,
  type = "all",
  limit = 6,
}: {
  query: string;
  type?: SearchProviderKey | "all";
  limit?: number;
}): Promise<SearchResponse> {
  const normalizedQuery = normalizeQuery(query);
  const settings = await getSearchSettingsRuntimeAction();
  const minSearchLength = settings.minSearchLength || 2;

  if (!settings.integratedSearchEnabled || normalizedQuery.length < minSearchLength) {
    return {
      query: normalizedQuery,
      type,
      groups: [],
      totalCount: 0,
    };
  }

  const enabledByKey: Record<string, boolean> = {
    document: settings.documentSearchEnabled,
    comment: settings.commentSearchEnabled,
    attachment: settings.attachmentSearchEnabled,
    user: settings.userSearchEnabled,
  };
  const providers = searchProviders.filter((provider) => {
    if (type !== "all" && provider.key !== type) return false;
    if (provider.source === "extension" && !settings.extensionSearchEnabled) return false;
    if (provider.key in enabledByKey) return enabledByKey[provider.key];
    return true;
  });
  const groups = await Promise.all(
    providers.map(async (provider) => {
      const items = await provider.search({
        query: normalizedQuery,
        type,
        limit: provider.limit || settings.defaultResultLimit || limit,
      });

      return {
        key: provider.key,
        label: provider.label,
        count: items.length,
        items,
      };
    }),
  );
  const visibleGroups = groups.filter((group) => group.count > 0);
  const sanitizedGroups = settings.includeUserEmail
    ? visibleGroups
    : visibleGroups.map((group) => group.key === "user"
      ? {
          ...group,
          items: group.items.map((item) => ({
            ...item,
            excerpt: undefined,
          })),
        }
      : group);

  return {
    query: normalizedQuery,
    type,
    groups: sanitizedGroups,
    totalCount: sanitizedGroups.reduce((total, group) => total + group.count, 0),
  };
}
