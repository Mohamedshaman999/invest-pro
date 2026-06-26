import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "investpro-theme";

export type ResolvedTheme = "light" | "dark";
type StoredPreference = "light" | "dark" | null;

type ThemeContextValue = {
  /** Effective theme applied to the UI */
  resolvedTheme: ResolvedTheme;
  /** `null` means following system preference */
  storedPreference: StoredPreference;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): StoredPreference {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function getSystemDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDocumentTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.appTheme = resolved;
  root.classList.toggle("dark", resolved === "dark");
  document.body.classList.toggle("light", resolved === "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedPreference, setStoredPreference] = useState<StoredPreference>(readStoredPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemDark);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (storedPreference === "light" || storedPreference === "dark") {
      return storedPreference;
    }
    return systemPrefersDark ? "dark" : "light";
  }, [storedPreference, systemPrefersDark]);

  useEffect(() => {
    applyDocumentTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (storedPreference !== null) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [storedPreference]);

  const toggleTheme = useCallback(() => {
    const next: ResolvedTheme = resolvedTheme === "dark" ? "light" : "dark";
    setStoredPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      resolvedTheme,
      storedPreference,
      toggleTheme,
    }),
    [resolvedTheme, storedPreference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
