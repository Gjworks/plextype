export type MobileHostingData = {
  hostingRequests: Array<{
    uuid: string;
    serviceName: string;
    domain: string;
    installType: string;
    status: string;
    jobStatus: string | null;
    jobStep: string | null;
    updatedAt: Date;
    completedAt: Date | null;
  }>;
  hostingLogs: Array<{
    uuid: string;
    instanceUuid: string;
    serviceName: string;
    domain: string;
    type: string;
    status: string;
    step: string | null;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
  }>;
};

export async function isProtectedUpload(_filePath: string): Promise<boolean> {
  return false;
}

export async function getMobileHostingData(_userId: number): Promise<MobileHostingData> {
  return { hostingRequests: [], hostingLogs: [] };
}
