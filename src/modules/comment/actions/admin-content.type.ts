export interface AdminCommentListItem {
  id: number;
  uuid: string;
  slug: string;
  content: string;
  isDeleted: boolean;
  isSecret: boolean;
  status: string | null;
  depth: number;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    nickName: string;
    accountId: string;
    profile: {
      profileImage: string | null;
    } | null;
  } | null;
  document: {
    id: number;
    slug: string;
    title: string | null;
    module: {
      id: number;
      mid: string;
      moduleName: string;
    };
  };
}

export interface AdminCommentListData {
  items: AdminCommentListItem[];
  navigation: {
    totalCount: number;
    totalPages: number;
    page: number;
    listCount: number;
  };
}
