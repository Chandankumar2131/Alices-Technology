import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isLight = theme === "light";

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", isLight);
    document.documentElement.classList.toggle("theme-dark", !isLight);
    localStorage.setItem("theme", theme);
  }, [isLight, theme]);

  const changeTheme = () => {
    const nextTheme = isLight ? "dark" : "light";

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setTheme(nextTheme));
      });
      return;
    }

    document.documentElement.classList.add("theme-switching");
    setTheme(nextTheme);
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-switching");
    }, 360);
  };

  return (
    <button
      type="button"
      onClick={changeTheme}
      className="theme-toggle inline-flex h-10 items-center gap-2 rounded-full border px-2.5 text-xs font-semibold uppercase tracking-[0.08em] transition"
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <span className="theme-toggle-track relative h-5 w-9 rounded-full">
        <span className="theme-toggle-thumb absolute top-0.5 h-4 w-4 rounded-full transition-transform" />
      </span>
      <span className="hidden sm:inline">{isLight ? "Light" : "Dark"}</span>
    </button>
  );
}
