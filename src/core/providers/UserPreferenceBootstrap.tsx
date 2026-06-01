"use client";

import { useEffect } from "react";

import { useUserContext } from "@/core/providers/UserProvider";

type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "userThemePreference";

const applyTheme = (theme: ThemePreference) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldUseDark);
  document.documentElement.dataset.theme = theme;
};

const resolveStoredTheme = (value: string | null): ThemePreference => {
  if (value === "light" || value === "dark") return value;
  return "system";
};

const UserPreferenceBootstrap = () => {
  const { user } = useUserContext();

  useEffect(() => {
    const savedTheme = user?.preferences?.theme || resolveStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));
    applyTheme(savedTheme);
    localStorage.setItem(THEME_STORAGE_KEY, savedTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = resolveStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));
      if (currentTheme === "system") applyTheme("system");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [user?.preferences?.theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = user?.preferences?.reduceMotion ? "reduced" : "default";
    document.documentElement.dataset.fontScale = user?.preferences?.fontScale || "normal";
  }, [user?.preferences?.fontScale, user?.preferences?.reduceMotion]);

  return null;
};

export default UserPreferenceBootstrap;
