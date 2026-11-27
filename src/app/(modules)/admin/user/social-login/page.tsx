import SocialLoginSettingsAdmin from "@/modules/user/admin/socialLogin";
import { getSocialLoginSettingsAdminAction } from "@/modules/user/actions/social.action";

export const dynamic = "force-dynamic";

// 관리자 설정 화면. 권한 검사는 액션이 한다.
const Page = async () => <SocialLoginSettingsAdmin initial={await getSocialLoginSettingsAdminAction()} />;

export default Page;
