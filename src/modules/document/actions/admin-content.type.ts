export interface AdminDocumentListItem {
  id: number;
  slug: string;
  title: string;
  preview: string;
  status: string | null;
  published: boolean | null;
  isNotice: boolean | null;
  isSecrets: boolean | null;
  readCount: number | null;
  commentCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  module: {
    id: number;
    mid: string;
    moduleName: string;
  };
  category: {
    id: number;
    title: string;
  } | null;
  user: {
    id: number;
    nickName: string;
    accountId: string;
    profile: {
      profileImage: string | null;
    } | null;
  } | null;
}

export interface AdminDocumentListData {
  items: AdminDocumentListItem[];
  navigation: {
    totalCount: number;
    totalPages: number;
    page: number;
    listCount: number;
  };
}
