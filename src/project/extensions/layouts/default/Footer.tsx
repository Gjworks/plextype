"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";

import { useUserContext } from "@/core/providers/UserProvider";
import { saveMyPreferenceAction } from "@/modules/user/actions/preference.action";
import type { UserPreferenceData, UserThemePreference } from "@/modules/user/actions/preference.query";
import type { SiteNavigationItem } from "@/modules/admin/actions/_type";

const fallbackPartnerItems: Pick<SiteNavigationItem, "name" | "title" | "href" | "target">[] = [
  { name: "partner-center", title: "파트너 센터", href: "/public", target: null },
  { name: "partner-apply", title: "파트너 신청", href: "/public", target: null },
];

const fallbackDeveloperItems: Pick<SiteNavigationItem, "name" | "title" | "href" | "target">[] = [
  { name: "documentation", title: "Documentation", href: "/features/getting-started", target: null },
  { name: "orders", title: "구매내역", href: "/public", target: null },
  { name: "store", title: "스토어", href: "/posts/store", target: null },
  { name: "license", title: "License", href: "/license", target: null },
];

const fallbackFooterItems: Pick<SiteNavigationItem, "name" | "title" | "href" | "target">[] = [
  { name: "about-footer", title: "ABOUT", href: "/about", target: null },
  { name: "terms-footer", title: "Terms of service", href: "/terms", target: null },
  { name: "privacy-footer", title: "Privacy policy", href: "/privacy", target: null },
];

const THEME_STORAGE_KEY = "userThemePreference";

const writeThemeCookie = (theme: UserThemePreference) => {
  document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(theme)}; path=/; max-age=31536000; samesite=lax`;
};

const defaultUserPreference: UserPreferenceData = {
  theme: "system",
  notifyComments: true,
  notifyReplies: true,
  notifyAdmin: true,
  showProfileImage: true,
  showNickname: true,
  editorCompact: true,
  reduceMotion: false,
  fontScale: "normal",
};

const themeOptions: Array<{
  value: UserThemePreference;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "system", label: "System", icon: <Monitor size={13} /> },
  { value: "light", label: "Light", icon: <Sun size={13} /> },
  { value: "dark", label: "Dark", icon: <Moon size={13} /> },
];

const resolveThemePreference = (value?: string | null): UserThemePreference => {
  if (value === "light" || value === "dark") return value;
  return "system";
};

const applyThemePreference = (theme: UserThemePreference) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldUseDark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  writeThemeCookie(theme);
};

const Footer = ({
  siteTitle = "지제이웍스",
  footerItems = [],
  partnerItems = [],
  developerItems = [],
}: {
  siteTitle?: string;
  footerItems?: SiteNavigationItem[];
  partnerItems?: SiteNavigationItem[];
  developerItems?: SiteNavigationItem[];
}) => {
  const displayFooterItems = footerItems.length > 0 ? footerItems : fallbackFooterItems;
  const displayPartnerItems = partnerItems.length > 0 ? partnerItems : fallbackPartnerItems;
  const displayDeveloperItems = developerItems.length > 0 ? developerItems : fallbackDeveloperItems;
  const { user, refetch } = useUserContext();
  const [themePreference, setThemePreference] = useState<UserThemePreference>("system");
  const [, startThemeTransition] = useTransition();

  const variants = {
    onscreen: {
      opacity: [0, 1],
      transition: {
        staggerChildren: 0.1,
      },
    },
    offscreen: {
      opacity: 0,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
  };
  const parentVariants = {
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    offscreen: {
      y: 15,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  useEffect(() => {
    const savedTheme = resolveThemePreference(user?.preferences?.theme);
    setThemePreference(savedTheme);
  }, [user?.preferences?.theme]);

  const handleThemePreferenceChange = (theme: UserThemePreference) => {
    setThemePreference(theme);
    applyThemePreference(theme);

    if (!user?.id) return;

    const nextPreference: UserPreferenceData = {
      ...defaultUserPreference,
      ...(user.preferences || {}),
      theme,
    };
    const formData = new FormData();
    Object.entries(nextPreference).forEach(([key, value]) => {
      formData.set(key, String(value));
    });

    startThemeTransition(async () => {
      const result = await saveMyPreferenceAction(formData);
      if (result.success && result.data) {
        setThemePreference(result.data.theme);
        applyThemePreference(result.data.theme);
        void refetch();
      }
    });
  };

  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-8 px-3 pt-6">
          <motion.div
            variants={variants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.3 }}
            className="lg:order-0 order-1 flex w-full flex-wrap gap-4 lg:flex-1"
          >
            <motion.div className="flex w-full flex-wrap items-center gap-1 lg:gap-4">
              <motion.div
                variants={parentVariants}
                className="flex w-full items-center text-xs text-black lg:w-16 dark:text-white"
              >
                Partners
              </motion.div>
              <motion.div className="col-span-3 flex items-center lg:col-span-1">
                <div className="flex gap-4">
                  {displayPartnerItems.map((item) => (
                    <motion.div key={item.name || item.href} variants={parentVariants} className="">
                      <Link
                        href={item.href}
                        target={item.target || undefined}
                        rel={item.target === "_blank" ? "noreferrer" : undefined}
                        className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                      >
                        {item.title}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
            <div className="flex w-full flex-wrap gap-1 lg:gap-4">
              <motion.div
                variants={parentVariants}
                className="flex w-full items-center text-xs text-black lg:w-16 dark:text-white"
              >
                Developer
              </motion.div>
              <motion.div className="col-span-3 flex items-center lg:col-span-1">
                <div className="flex flex-wrap gap-4">
                  {displayDeveloperItems.map((item) => (
                    <motion.div key={item.name || item.href} variants={parentVariants}>
                      <Link
                        href={item.href}
                        target={item.target || undefined}
                        rel={item.target === "_blank" ? "noreferrer" : undefined}
                        className="dark:text-dark-400 text-xs text-gray-400 hover:text-black dark:hover:text-white"
                      >
                        {item.title}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            variants={variants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.3 }}
            className="order-0 flex items-center lg:order-1"
          >
            <motion.div
              variants={parentVariants}
              className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/60 p-0.5 dark:border-dark-700 dark:bg-dark-900/80"
            >
              {themeOptions.map((item) => {
                const active = themePreference === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleThemePreferenceChange(item.value)}
                    className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${
                      active
                        ? "bg-gray-950 text-white dark:bg-dark-100 dark:text-dark-950"
                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-dark-100"
                    }`}
                    aria-label={`${item.label} theme`}
                    aria-pressed={active}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
        {/* <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200/75 dark:via-dark-700 to-transparent"></div> */}
        <div className="relative">
          <div className="block-line-t">
            <motion.div
              variants={variants}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: false, amount: 0.3 }}
              className="flex flex-wrap justify-center gap-8 pt-3 pb-6"
            >
              <motion.div className="flex items-center lg:justify-end">
                <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
                  <motion.div
                    className="order-4 flex w-full items-center justify-center md:order-1 md:pt-0 lg:w-auto"
                    variants={parentVariants}
                  >
                    <div className="dark:text-dark-200 text-center text-xs text-gray-950 lg:text-left pt-1">
                      ⓒ {siteTitle}
                    </div>
                  </motion.div>
                  {displayFooterItems.map((item) => (
                    <motion.div
                      key={item.name || item.href}
                      variants={parentVariants}
                      className="order-1 md:order-2"
                    >
                      <Link
                        href={item.href}
                        target={item.target || undefined}
                        rel={item.target === "_blank" ? "noreferrer" : undefined}
                        className="dark:text-dark-400 text-xs text-gray-400 hover:text-gray-950 dark:hover:text-white hover:underline"
                      >
                        {item.title}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
