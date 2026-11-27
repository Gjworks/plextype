import { formatKstShortDateTime } from "@/core/utils/date/kst";

import type { SocialLoginUserLinksViewProps } from "@/modules/user/actions/social.type";
import { ProviderIcon } from "@/modules/user/tpl/shared/SocialProviderIcon";

// 흰 바탕의 대표색은 화면 바탕과 구분되지 않아 테두리를 준다.
const tileBorder = (background: string) => (/^#f{3}(f{3})?$/i.test(background) ? "ring-1 ring-inset ring-gray-200 dark:ring-dark-700" : "");

// 연결·해제 화면의 기본 모양. 적용된 회원 스킨이 socialLoginLinks를 등록하지 않았을 때 쓰인다. 데이터를 조회하지 않고 받은 속성만 그린다.
const UserLinksView = ({ title, description, framed, links, unlinkAction }: SocialLoginUserLinksViewProps) => {
  const listBorder = framed ? "" : "border-t";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-800 dark:bg-dark-950">
      {!framed && (
        <div className="px-5 py-6 md:px-7">
          <div className="text-lg font-semibold text-gray-800 dark:text-dark-100">{title}</div>
          <div className="mt-1 text-sm text-gray-400">{description}</div>
        </div>
      )}
      {links.length === 0 ? (
        <div className={`${listBorder} border-gray-100 px-5 py-10 text-center text-sm text-gray-400 dark:border-dark-800 md:px-7`}>
          이 사이트에서 사용할 수 있는 소셜 로그인이 없습니다.
        </div>
      ) : (
        <ul className={`divide-y divide-gray-100 ${listBorder} border-gray-100 dark:divide-dark-800 dark:border-dark-800`}>
          {links.map((link) => (
            <li key={link.key} className="flex flex-wrap items-center gap-4 px-5 py-4 md:px-7">
              <span
                style={{ background: link.brand.background, color: link.brand.color }}
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tileBorder(link.brand.background)}`}
              >
                <ProviderIcon providerKey={link.key} label={link.label} logo={link.logo} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">{link.label}</div>
                <div className="mt-0.5 truncate text-xs text-gray-400">
                  {link.linked
                    ? `${link.email ?? "연결됨"}${link.linkedAt ? ` · ${formatKstShortDateTime(link.linkedAt)}` : ""}`
                    : "연결되지 않음"}
                </div>
              </div>
              {link.linked ? (
                link.canUnlink ? (
                  <form action={unlinkAction}>
                    <input type="hidden" name="provider" value={link.key} />
                    <button type="submit" className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-700 dark:text-dark-200 dark:hover:bg-dark-900">
                      연결 해제
                    </button>
                  </form>
                ) : (
                  // 이 연결로 만든 계정은 비밀번호를 모르므로, 해제하면 로그인할 방법이 없어진다.
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500 dark:bg-dark-800 dark:text-dark-400">가입에 사용한 계정</span>
                )
              ) : (
                <a href={link.linkHref} className="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-dark-950">
                  연결
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UserLinksView;
