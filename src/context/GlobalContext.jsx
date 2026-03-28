import { createContext, useState, useContext, useCallback, useMemo, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GlobalContext — app-wide UI preferences (theme, locale, sidebar state, etc.)
// Intentionally separate from AppContext (which owns HR data & company config).
// Bridge: GlobalProvider reads company.currency from AppContext on first mount
// via the syncCurrency prop passed down from App.jsx.
// ─────────────────────────────────────────────────────────────────────────────

const LS_SETTINGS_KEY = "attritioniq_global_settings";

const DEFAULT_SETTINGS = {
  currency: "USD",   // kept in sync with AppContext.company.currency
  locale: "en-US",
  theme: "light",    // "light" | "dark"
  sidebarOpen: true,
  compactMode: false,
};

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  const [profile, setProfileState] = useState(null);

  const [settings, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SETTINGS_KEY);
      if (!saved) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { return DEFAULT_SETTINGS; }
  });

  // ── Apply theme to <html> element whenever it changes ──
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    }
  }, [settings.theme]);

  const setProfile = useCallback((data) => {
    setProfileState(data);
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

const syncCurrency = useCallback((currency, companyName) => {
  if (!currency) return;
  setSettingsState(prev => {
    if (prev.currency === currency && prev.lastCompany === companyName) return prev;
    const next = {
      ...prev,
      currency,
      // Simpan nama company terakhir sebagai penanda session
      lastCompany: companyName ?? prev.lastCompany,
    };
    try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
}, []);

  const resetAll = useCallback(() => {
  setProfileState(null);
  setSettingsState(DEFAULT_SETTINGS);
  try {
    localStorage.removeItem(LS_SETTINGS_KEY);
    // Bersihkan semua key GlobalContext — termasuk lastCompany
    const keysToRemove = Object.keys(localStorage)
      .filter(k => k.startsWith("attritioniq_global"));
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
}, []);

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  }, [settings.theme, updateSettings]);

  const contextValue = useMemo(() => ({
    profile,
    setProfile,
    settings,
    updateSettings,
    syncCurrency,
    resetAll,
    toggleTheme,
    // Convenience shorthands
    theme: settings.theme,
    isDark: settings.theme === "dark",
  }), [profile, setProfile, settings, updateSettings, syncCurrency, resetAll, toggleTheme]);

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export function useGlobal() {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobal must be used inside <GlobalProvider>");
  return ctx;
}

// Convenience hook — just for theme, avoids full context subscription
export function useTheme() {
  const { theme, isDark, toggleTheme, updateSettings } = useGlobal();
  return { theme, isDark, toggleTheme, updateSettings };
}


// ── useWindowSize — reactive window dimensions ──
// Dipakai App.jsx untuk auto-collapse sidebar di mobile
// tanpa addEventListener manual yang berulang di setiap komponen
//
// Usage:
//   const { isMobile, isTablet, width } = useWindowSize();
//
export function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width:    typeof window !== "undefined" ? window.innerWidth  : 1280,
    height:   typeof window !== "undefined" ? window.innerHeight : 800,
    isMobile: typeof window !== "undefined" ? window.innerWidth  < 768  : false,
    isTablet: typeof window !== "undefined" ? window.innerWidth  < 1024 : false,
  }));

  useEffect(() => {
    let rafId;
    const handler = () => {
      // Pakai requestAnimationFrame agar tidak flood resize events
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setSize({
          width:    w,
          height:   h,
          isMobile: w < 768,
          isTablet: w < 1024,
        });
      });
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return size;
}
