export interface PageNavigationInfo {
  totalCount: number;
  totalPages: number;
  page: number;
  listCount: number;
}

export interface PostListResponse {
  items: any[]; // 구체적인 Post 타입으로 대체 권장
  pagination: PageNavigationInfo;
}