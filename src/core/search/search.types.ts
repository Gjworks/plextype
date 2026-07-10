export type SearchProviderKey = "document" | "comment" | "attachment" | "user" | string;

export type SearchParams = {
  query: string;
  type?: SearchProviderKey | "all";
  limit: number;
};

export type SearchResultItem = {
  id: string;
  type: SearchProviderKey;
  title: string;
  excerpt?: string;
  href: string;
  module?: string;
  authorName?: string;
  createdAt?: string;
  meta?: Record<string, unknown>;
};

export type SearchResultGroup = {
  key: SearchProviderKey;
  label: string;
  count: number;
  items: SearchResultItem[];
};

export type SearchResponse = {
  query: string;
  type: SearchProviderKey | "all";
  groups: SearchResultGroup[];
  totalCount: number;
};

export type SearchProvider = {
  key: SearchProviderKey;
  label: string;
  enabled: boolean;
  order: number;
  source?: "core" | "extension";
  limit?: number;
  search: (params: SearchParams) => Promise<SearchResultItem[]>;
};
