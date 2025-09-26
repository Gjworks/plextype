declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare global {
  interface AuthUser {
    id: number;
    accountId: string;
    isAdmin: boolean;
    groups: [];
    exp: date;
  }
  interface UserGroupInfo {
    groupId: number;
    groupTitle: string;
    groupDesc: string;
    groupName: string;
  }
  interface UserInfo {
    userGroups: any;
    id: number;
    uuid: string;
    accountId: string;
    nickName: string;
    password: string;
    email_address: string;
    createdAt?: date;
    updateAt?: date;
    isAdmin?: boolean | null;
    isManager?: boolean | null;
    refreshToken?: string | null;
    group?: UserGroupInfo[] | null;
  }
  var Log: typeof Log;
}

export {};
