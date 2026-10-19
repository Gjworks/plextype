"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Bell, RefreshCw, Smartphone } from "lucide-react";
import { NotificationSettingsData } from "@/modules/notification/actions/settings.type";
import { updateNotificationSettingsAdminAction } from "@/modules/notification/actions/settings.action";
import Button from "@components/button/Button";
import InputField from "@components/form/InputField";
import {
  settingsPrimaryButtonClass,
  settingsGhostButtonClass,
  settingsDarkButtonClass,
  settingsIconButtonClass,
  StatusPill,
  SectionShell,
  FieldRow,
  Toggle,
} from "@/core/components/admin/SettingsFields";

type PwaRuntimeStatus = {
  pwa: {
    enabled: boolean;
    manifest: boolean;
    serviceWorker: boolean;
    icons: boolean;
    secureContext: boolean;
  };
  webPush: {
    enabled: boolean;
    configured: boolean;
    publicKey: boolean;
    privateKey: boolean;
    subject: string;
    activeSubscriptions: number;
  };
  fcmPush: {
    enabled: boolean;
    projectId: boolean;
    credentials: boolean;
  };
};

type BrowserPushState = {
  checked: boolean;
  serviceWorker: boolean;
  pushManager: boolean;
  notification: boolean;
  badge: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

const sectionMeta = {
  notification: {
    label: "알림 설정",
    eyebrow: "Signal",
    description: "댓글, 답글, 실시간 알림의 기본 정책입니다.",
  },
};

const urlBase64ToUint8Array = (value: string) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
};

const getWebPushKeyErrorMessage = (message?: string) => {
  if (message?.includes("WEB_PUSH_VAPID_PUBLIC_KEY")) {
    return "Web Push 공개 키가 아직 설정되지 않았습니다.";
  }

  return message || "Web Push 공개 키가 설정되지 않았습니다.";
};

const UploadNumberField = ({
  refObject,
  title,
  description,
  unit,
  name,
  value,
  onChange,
  error,
  placeholder,
}: {
  refObject?: React.Ref<HTMLInputElement>;
  title: string;
  description: string;
  unit: string;
  name: string;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder: string;
}) => {
  return (
    <div className="rounded-md border border-gray-100 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
      <div className="mb-3 min-h-[58px]">
        <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-6 text-gray-400">
          {description}
        </div>
      </div>
      <div className="relative">
        <InputField
          ref={refObject}
          inputTitle={title}
          name={name}
          type="number"
          value={value}
          onChange={onChange}
          error={error}
          placeholder={placeholder}
          hideLabel
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
          {unit}
        </span>
      </div>
    </div>
  );
};

const UploadTogglePolicy = ({
  title,
  description,
  name,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-gray-100 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-800 dark:text-dark-100">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-6 text-gray-400">
          {description}
        </div>
      </div>
      <Toggle name={name} checked={checked} onChange={onChange} />
    </div>
  );
};

const defaultNotificationSettings: NotificationSettingsData = {
  commentNotificationsEnabled: true,
  replyNotificationsEnabled: true,
  adminContentNotificationsEnabled: true,
  forceLogoutNotificationsEnabled: true,
  pwaEnabled: true,
  webPushEnabled: true,
  fcmPushEnabled: true,
  excludeSelfNotifications: true,
  realtimeNotificationsEnabled: true,
  toastNotificationsEnabled: true,
  showNotificationThumbnails: true,
  unreadPreviewLimit: 20,
  historyPageSize: 20,
  retentionDays: 90,
};

const Settings = ({
  initialNotificationSettings = defaultNotificationSettings,
}: {
  initialNotificationSettings?: NotificationSettingsData;
}) => {
  const activeSection = "notification";

  const meta = useMemo(() => sectionMeta[activeSection], [activeSection]);

  const [isPending, startTransition] = useTransition();

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingsData>(initialNotificationSettings);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(
    null,
  );

  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [pwaStatus, setPwaStatus] = useState<PwaRuntimeStatus | null>(null);

  const [pwaStatusLoading, setPwaStatusLoading] = useState(false);

  const [browserPushState, setBrowserPushState] = useState<BrowserPushState>({
    checked: false,
    serviceWorker: false,
    pushManager: false,
    notification: false,
    badge: false,
    permission: "unsupported",
    subscribed: false,
  });

  const unreadPreviewLimitRef = useRef<HTMLInputElement>(null);

  const historyPageSizeRef = useRef<HTMLInputElement>(null);

  const retentionDaysRef = useRef<HTMLInputElement>(null);

  const refreshBrowserPushState = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return;
    const serviceWorker = "serviceWorker" in navigator;
    const pushManager = "PushManager" in window;
    const notification = "Notification" in window;
    const badge = "setAppBadge" in navigator || "clearAppBadge" in navigator;
    let subscribed = false;
    if (serviceWorker && pushManager) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        subscribed = Boolean(subscription);
      } catch {
        subscribed = false;
      }
    }
    setBrowserPushState({
      checked: true,
      serviceWorker,
      pushManager,
      notification,
      badge,
      permission: notification ? Notification.permission : "unsupported",
      subscribed,
    });
  };

  const refreshPwaStatus = async () => {
    setPwaStatusLoading(true);
    try {
      const response = await fetch(
        "/api/admin/settings/notification/pwa-status",
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (result?.success) {
        setPwaStatus(result.status);
      }
    } catch (error) {
      console.error("PWA status load failed:", error);
    } finally {
      setPwaStatusLoading(false);
    }
  };

  const handleEnableWebPush = async () => {
    setFormMessage(null);
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setFormMessage({
          type: "error",
          message: "현재 브라우저는 Web Push를 지원하지 않습니다.",
        });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        await refreshBrowserPushState();
        setFormMessage({
          type: "error",
          message: "브라우저 알림 권한이 허용되지 않았습니다.",
        });
        return;
      }
      const keyResponse = await fetch("/api/web-push/vapid-public-key", {
        credentials: "include",
        cache: "no-store",
      });
      const keyResult = await keyResponse.json();
      if (!keyResponse.ok || !keyResult?.publicKey) {
        setFormMessage({
          type: "error",
          message: getWebPushKeyErrorMessage(keyResult?.message),
        });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      const subscription =
        current ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyResult.publicKey),
        }));
      const saveResponse = await fetch("/api/web-push/subscriptions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      });
      const saveResult = await saveResponse.json();
      if (!saveResponse.ok || !saveResult?.success) {
        setFormMessage({
          type: "error",
          message:
            saveResult?.message || "브라우저 푸시 구독 저장에 실패했습니다.",
        });
        return;
      }
      await refreshBrowserPushState();
      await refreshPwaStatus();
      setFormMessage({
        type: "success",
        message: "현재 브라우저의 Web Push 구독을 등록했습니다.",
      });
    } catch (error) {
      console.error("Web Push enable failed:", error);
      setFormMessage({
        type: "error",
        message: "Web Push 구독 등록 중 오류가 발생했습니다.",
      });
    }
  };

  const handleDisableWebPush = async () => {
    setFormMessage(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        await refreshBrowserPushState();
        return;
      }
      await fetch("/api/web-push/subscriptions", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      await refreshBrowserPushState();
      await refreshPwaStatus();
      setFormMessage({
        type: "success",
        message: "현재 브라우저의 Web Push 구독을 해제했습니다.",
      });
    } catch (error) {
      console.error("Web Push disable failed:", error);
      setFormMessage({
        type: "error",
        message: "Web Push 구독 해제 중 오류가 발생했습니다.",
      });
    }
  };

  useEffect(() => {
    refreshPwaStatus();
    refreshBrowserPushState();
  }, [activeSection]);

  const handleNotificationInputChange =
    (field: keyof NotificationSettingsData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNotificationSettings((prev) => ({
        ...prev,
        [field]: Number(e.target.value),
      }));
    };

  const handleNotificationToggleChange =
    (field: keyof NotificationSettingsData) => (checked: boolean) => {
      setNotificationSettings((prev) => ({
        ...prev,
        [field]: checked,
      }));
    };

  const resetNotificationSettings = () => {
    setFieldErrors(null);
    setFormMessage(null);
    setNotificationSettings(initialNotificationSettings);
  };

  const handleNotificationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateNotificationSettingsAdminAction(formData);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.unreadPreviewLimit)
            unreadPreviewLimitRef.current?.focus();
          else if (result.fieldErrors.historyPageSize)
            historyPageSizeRef.current?.focus();
          else if (result.fieldErrors.retentionDays)
            retentionDaysRef.current?.focus();
        } else {
          setFormMessage({ type: "error", message: result.message });
        }
        return;
      }
      if (result.data) setNotificationSettings(result.data);
      setFormMessage({ type: "success", message: result.message });
    });
  };

  const handleSubmit = handleNotificationSubmit;

  const handleReset = resetNotificationSettings;

  return (
    <form
      className="max-w-screen-2xl mx-auto px-3 py-10 dark:text-dark-100"
      onSubmit={handleSubmit}
    >
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
            System Control / {meta.eyebrow}
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-700 dark:text-dark-100">
            {meta.label}
          </div>
          <div className="mt-1 text-sm text-gray-400">{meta.description}</div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={!handleReset || isPending}
            onClick={handleReset}
            className="border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 hover:ring-4 hover:ring-gray-100/70 disabled:bg-white disabled:text-gray-300 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-300 dark:hover:border-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-100 dark:hover:ring-dark-800/35 dark:disabled:bg-dark-900 dark:disabled:text-dark-600"
          >
            초기화
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={!handleSubmit}
            className={settingsPrimaryButtonClass}
          >
            저장하기
          </Button>
        </div>
      </div>

      {formMessage && (
        <div
          className={`mb-6 rounded-md px-3 py-2 text-sm leading-6 ${formMessage.type === "success" ? "bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300" : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300"}`}
        >
          {formMessage.message}
        </div>
      )}

      {false}

      {false}

      {false}

      {false}

      {
        <>
          <SectionShell
            icon={<Bell size={13} />}
            title="알림 생성"
            description="어떤 이벤트에서 알림을 만들지 정합니다. 글/댓글 작성 화면의 개별 수신 옵션도 이 정책 아래에서 동작합니다."
          >
            <FieldRow
              label="커뮤니티 알림"
              description="댓글과 답글은 알림이 많이 발생하기 쉬운 영역입니다. 전체 정책을 끄면 개별 글/댓글 옵션보다 우선합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <UploadTogglePolicy
                  title="댓글 알림"
                  description="게시글에 새 댓글이 달리면 글 작성자에게 알림을 보냅니다."
                  name="commentNotificationsEnabled"
                  checked={notificationSettings.commentNotificationsEnabled}
                  onChange={handleNotificationToggleChange(
                    "commentNotificationsEnabled",
                  )}
                />
                <UploadTogglePolicy
                  title="답글 알림"
                  description="내 댓글에 답글이 달리면 댓글 작성자에게 알림을 보냅니다."
                  name="replyNotificationsEnabled"
                  checked={notificationSettings.replyNotificationsEnabled}
                  onChange={handleNotificationToggleChange(
                    "replyNotificationsEnabled",
                  )}
                />
              </div>
            </FieldRow>
            <FieldRow
              label="관리 알림"
              description="관리자 화면에서 발생한 강제 처리 이벤트를 사용자에게 알릴지 정합니다."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <UploadTogglePolicy
                  title="콘텐츠 처리 알림"
                  description="관리자가 게시글, 댓글, 첨부파일을 삭제하면 작성자에게 알림을 보냅니다."
                  name="adminContentNotificationsEnabled"
                  checked={
                    notificationSettings.adminContentNotificationsEnabled
                  }
                  onChange={handleNotificationToggleChange(
                    "adminContentNotificationsEnabled",
                  )}
                />
                <UploadTogglePolicy
                  title="강제 로그아웃 알림"
                  description="관리자가 접속 중인 사용자를 강제로 로그아웃했을 때 알림을 보냅니다."
                  name="forceLogoutNotificationsEnabled"
                  checked={notificationSettings.forceLogoutNotificationsEnabled}
                  onChange={handleNotificationToggleChange(
                    "forceLogoutNotificationsEnabled",
                  )}
                />
              </div>
            </FieldRow>
            <FieldRow
              label="공통 정책"
              description="알림 생성 후 실시간 전달과 토스트 표시 방식을 정합니다."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <UploadTogglePolicy
                  title="본인 액션 제외"
                  description="내가 작성한 댓글이나 처리로 나에게 알림이 가지 않게 합니다."
                  name="excludeSelfNotifications"
                  checked={notificationSettings.excludeSelfNotifications}
                  onChange={handleNotificationToggleChange(
                    "excludeSelfNotifications",
                  )}
                />
                <UploadTogglePolicy
                  title="실시간 알림"
                  description="DB 저장 후 SSE로 즉시 브라우저에 전달합니다."
                  name="realtimeNotificationsEnabled"
                  checked={notificationSettings.realtimeNotificationsEnabled}
                  onChange={handleNotificationToggleChange(
                    "realtimeNotificationsEnabled",
                  )}
                />
                <UploadTogglePolicy
                  title="토스트 표시"
                  description="실시간 알림을 화면 우측 토스트로 표시합니다."
                  name="toastNotificationsEnabled"
                  checked={notificationSettings.toastNotificationsEnabled}
                  onChange={handleNotificationToggleChange(
                    "toastNotificationsEnabled",
                  )}
                />
                <UploadTogglePolicy
                  title="썸네일 표시"
                  description="알림에 이미지가 있으면 토스트와 목록에 함께 표시합니다."
                  name="showNotificationThumbnails"
                  checked={notificationSettings.showNotificationThumbnails}
                  onChange={handleNotificationToggleChange(
                    "showNotificationThumbnails",
                  )}
                />
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<Smartphone size={13} />}
            title="전달 채널"
            description="설치형 웹앱, 브라우저 푸시, 모바일 앱 푸시를 서비스별로 켜고 끕니다. 키와 secret은 환경변수/서버 secret에서 관리합니다."
          >
            <FieldRow
              label="채널 사용 여부"
              description="plextype core는 기능 엔진만 제공하고, 실제 서비스에서는 필요한 채널만 활성화합니다."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <UploadTogglePolicy
                  title="PWA 사용"
                  description="manifest, service worker, 앱 설치 버튼, 앱 배지 동기화를 사용합니다."
                  name="pwaEnabled"
                  checked={notificationSettings.pwaEnabled}
                  onChange={handleNotificationToggleChange("pwaEnabled")}
                />
                <UploadTogglePolicy
                  title="Web Push 사용"
                  description="브라우저 구독 등록과 Web Push 발송을 허용합니다. VAPID 키가 필요합니다."
                  name="webPushEnabled"
                  checked={notificationSettings.webPushEnabled}
                  onChange={handleNotificationToggleChange("webPushEnabled")}
                />
                <UploadTogglePolicy
                  title="FCM 모바일 푸시"
                  description="모바일 앱 토큰 등록과 Firebase 발송을 허용합니다. Firebase secret이 필요합니다."
                  name="fcmPushEnabled"
                  checked={notificationSettings.fcmPushEnabled}
                  onChange={handleNotificationToggleChange("fcmPushEnabled")}
                />
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<Smartphone size={13} />}
            title="PWA / Web Push"
            description="설치형 웹앱과 브라우저 푸시가 실제 사용자 환경에서 동작 가능한지 확인합니다."
          >
            <FieldRow
              label="서버 준비 상태"
              description="배포 환경에서는 HTTPS와 VAPID 키가 모두 준비되어야 브라우저 푸시가 발송됩니다."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                        PWA 리소스
                      </div>
                      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-dark-400">
                        매니페스트, 서비스워커, 앱 아이콘 라우트 상태입니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={refreshPwaStatus}
                      className={settingsIconButtonClass}
                      aria-label="PWA 상태 새로고침"
                    >
                      <RefreshCw
                        size={14}
                        className={pwaStatusLoading ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill
                      ok={Boolean(pwaStatus?.pwa.enabled)}
                      label="Enabled"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.pwa.manifest)}
                      label="Manifest"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.pwa.serviceWorker)}
                      label="Service Worker"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.pwa.icons)}
                      label="Icons"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.pwa.secureContext)}
                      label="HTTPS/localhost"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                      Web Push 서버
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-dark-400">
                      VAPID 환경변수와 현재 활성 브라우저 구독 수입니다.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill
                      ok={Boolean(pwaStatus?.webPush.enabled)}
                      label="Enabled"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.webPush.configured)}
                      label="VAPID configured"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.webPush.publicKey)}
                      label="Public key"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.webPush.privateKey)}
                      label="Private key"
                    />
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-dark-800 dark:text-dark-300">
                      구독 {pwaStatus?.webPush.activeSubscriptions ?? 0}개
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-gray-400 dark:text-dark-500">
                    Subject: {pwaStatus?.webPush.subject || "환경변수 확인 전"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-900 lg:col-span-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                      FCM 모바일 푸시
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-dark-400">
                      Firebase 프로젝트 ID와 Admin SDK secret 연결 상태입니다.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill
                      ok={Boolean(pwaStatus?.fcmPush.enabled)}
                      label="Enabled"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.fcmPush.projectId)}
                      label="Project ID"
                    />
                    <StatusPill
                      ok={Boolean(pwaStatus?.fcmPush.credentials)}
                      label="Admin SDK secret"
                    />
                  </div>
                </div>
              </div>
            </FieldRow>

            <FieldRow
              label="현재 브라우저"
              description="이 브라우저를 테스트 구독으로 등록해 실제 푸시 수신 준비 상태를 확인합니다."
            >
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                      브라우저 푸시 구독
                    </div>
                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-dark-400">
                      권한: {browserPushState.permission} · 상태:{" "}
                      {browserPushState.subscribed ? "구독됨" : "미구독"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={refreshBrowserPushState}
                      className={settingsGhostButtonClass}
                    >
                      상태 확인
                    </button>
                    {browserPushState.subscribed ? (
                      <button
                        type="button"
                        onClick={handleDisableWebPush}
                        className={settingsDarkButtonClass}
                      >
                        구독 해제
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnableWebPush}
                        className={settingsDarkButtonClass}
                      >
                        브라우저 알림 켜기
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill
                    ok={browserPushState.serviceWorker}
                    label="Service Worker"
                  />
                  <StatusPill
                    ok={browserPushState.pushManager}
                    label="Push Manager"
                  />
                  <StatusPill
                    ok={browserPushState.notification}
                    label="Notification API"
                  />
                  <StatusPill ok={browserPushState.badge} label="App Badge" />
                </div>
              </div>
            </FieldRow>
          </SectionShell>

          <SectionShell
            icon={<Bell size={13} />}
            title="알림 보관"
            description="알림 목록과 히스토리 화면의 기본값입니다."
          >
            <FieldRow
              label="노출 및 보관"
              description="알림 API가 기본으로 가져오는 개수와 보관 기간입니다. 보관 기간 정리는 추후 배치/관리 액션에서 이 값을 사용합니다."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <UploadNumberField
                  refObject={unreadPreviewLimitRef}
                  title="메뉴 미리보기"
                  description="알림 메뉴와 unread API에서 가져올 최대 개수입니다."
                  unit="개"
                  name="unreadPreviewLimit"
                  value={notificationSettings.unreadPreviewLimit}
                  onChange={handleNotificationInputChange("unreadPreviewLimit")}
                  error={fieldErrors?.unreadPreviewLimit}
                  placeholder="20"
                />
                <UploadNumberField
                  refObject={historyPageSizeRef}
                  title="히스토리 페이지"
                  description="알림 기록 화면의 기본 페이지 크기입니다."
                  unit="개"
                  name="historyPageSize"
                  value={notificationSettings.historyPageSize}
                  onChange={handleNotificationInputChange("historyPageSize")}
                  error={fieldErrors?.historyPageSize}
                  placeholder="20"
                />
                <UploadNumberField
                  refObject={retentionDaysRef}
                  title="보관 기간"
                  description="알림 기록을 보관할 기준 일수입니다."
                  unit="일"
                  name="retentionDays"
                  value={notificationSettings.retentionDays}
                  onChange={handleNotificationInputChange("retentionDays")}
                  error={fieldErrors?.retentionDays}
                  placeholder="90"
                />
              </div>
            </FieldRow>
          </SectionShell>
        </>
      }

      {false}
    </form>
  );
};
export default Settings;
