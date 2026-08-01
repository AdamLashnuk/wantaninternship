"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "wantaninternship-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

function hasSavedTheme() {
  try {
    return window.localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
}

function saveTheme(theme: Theme) {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // The theme still works for this visit if storage is unavailable.
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const currentTheme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";

    setTheme(currentTheme);

    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystemPreference = (event: MediaQueryListEvent) => {
      if (hasSavedTheme()) return;

      const nextTheme = event.matches ? "dark" : "light";
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    systemPreference.addEventListener("change", followSystemPreference);
    return () =>
      systemPreference.removeEventListener("change", followSystemPreference);
  }, []);

  const toggleTheme = () => {
    const currentTheme =
      theme ??
      (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const switchesTo = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${switchesTo} mode`}
      title={`Switch to ${switchesTo} mode`}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 15.1A8.5 8.5 0 0 1 8.9 3.5 8.5 8.5 0 1 0 20.5 15.1Z" />
        </svg>
      )}

      <span className="theme-toggle-label">
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
