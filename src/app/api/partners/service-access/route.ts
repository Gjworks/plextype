import { NextResponse } from "next/server";

import { getMyPartnerServiceAccessAction } from "@/extensions/partners/actions/partner.action";

export async function GET() {
  const access = await getMyPartnerServiceAccessAction();
  return NextResponse.json({ success: true, data: access });
}
