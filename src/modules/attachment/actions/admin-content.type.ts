export interface AdminAttachmentListItem {
  id: number;
  uuid: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: {
    id: number;
    nickName: string;
    accountId: string;
    profile: {
      profileImage: string | null;
    } | null;
  } | null;
}

export interface AdminAttachmentListData {
  items: AdminAttachmentListItem[];
  navigation: {
    totalCount: number;
    totalPages: number;
    page: number;
    listCount: number;
  };
}
