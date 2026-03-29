import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { idbClearPrefix } from "../hooks/useModularStorage";

const LS_MODULE_PREFIX = "attritioniq.mod.";
const LS_MOD_SESSION_KEY = "attritioniq.mod.session";
const ModuleDataContext = createContext(null);

function loadModuleFromStorage(name) {
  try {
    const raw = localStorage.getItem(`${LS_MODULE_PREFIX}${name}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveModuleToStorage(name, data) {
  try {
    if (data && Object.keys(data).length > 0) {
      localStorage.setItem(`${LS_MODULE_PREFIX}${name}`, JSON.stringify(data));
    } else {
      localStorage.removeItem(`${LS_MODULE_PREFIX}${name}`);
    }
  } catch {}
}

function clearModuleFromStorage(name) {
  try { localStorage.removeItem(`${LS_MODULE_PREFIX}${name}`); } catch {}
}

function clearAllModulesFromStorage() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_MODULE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

export const ModuleDataProvider = ({ children, dataSessionId }) => {

  const prevSessionRef = useRef(null);
  const [modulesData, setModulesData] = useState({});

  useEffect(() => {
  if (!dataSessionId) return;
  const storedSession = localStorage.getItem(LS_MOD_SESSION_KEY);

  if (storedSession && storedSession !== dataSessionId) {
    clearAllModulesFromStorage();
    setModulesData({});

idbClearPrefix(`mod__${storedSession}`).catch(() => {});
  }

  if (dataSessionId !== prevSessionRef.current) {
    prevSessionRef.current = dataSessionId;
    try { localStorage.setItem(LS_MOD_SESSION_KEY, dataSessionId); } catch {}
  }
}, [dataSessionId]);

  // ── Update a module's entire state (merges with existing) ──
  const updateModule = useCallback((name, patch) => {
  if (!name || typeof patch !== "object" || patch === null) return;
  setModulesData(prev => {
    const current = prev[name] || {};
    // Deep merge satu level — cegah patch menghapus key yang tidak disebut
    const next = {
      ...prev,
      [name]: { ...current, ...patch },
    };
    saveModuleToStorage(name, next[name]);
    return next;
  });
}, []);

  // ── Update a single field inside a module's state ──
  const setModuleField = useCallback((name, field, value) => {
    setModulesData(prev => {
      const next = {
        ...prev,
        [name]: { ...(prev[name] || {}), [field]: value },
      };
      saveModuleToStorage(name, next[name]);
      return next;
    });
  }, []);

  // ── Reset a single module's state (in-memory + storage) ──
  const resetModule = useCallback((name) => {
    setModulesData(prev => {
      const next = { ...prev, [name]: {} };
      clearModuleFromStorage(name);
      return next;
    });
  }, []);

  // ── Reset all modules (in-memory + storage) ──
  const resetAllModules = useCallback(() => {
    clearAllModulesFromStorage();
    setModulesData({});
  }, []);

  // ── Lazy-load a module's state from storage on first access ──
  const getModule = useCallback((name) => {
  // Cek session dulu sebelum baca dari storage
  // Kalau session belum divalidasi, jangan kembalikan data lama
  const storedSession = localStorage.getItem(LS_MOD_SESSION_KEY);
  if (dataSessionId && storedSession && storedSession !== dataSessionId) {
    return modulesData[name] ?? {};
  }
  return modulesData[name] ?? loadModuleFromStorage(name);
}, [modulesData, dataSessionId]);

  const contextValue = useMemo(() => ({
    modulesData,
    getModule,
    updateModule,
    setModuleField,
    resetModule,
    resetAllModules,
  }), [modulesData, getModule, updateModule, setModuleField, resetModule, resetAllModules]);

  return (
    <ModuleDataContext.Provider value={contextValue}>
      {children}
    </ModuleDataContext.Provider>
  );
};

export function useModuleData(moduleName) {
  const ctx = useContext(ModuleDataContext);
  if (!ctx) throw new Error("useModuleData must be used inside <ModuleDataProvider>");

  // If moduleName is provided, return scoped helpers for that module
  if (moduleName) {
    return {
      state: ctx.getModule(moduleName),
      update: (data) => ctx.updateModule(moduleName, data),
      setField: (field, value) => ctx.setModuleField(moduleName, field, value),
      reset: () => ctx.resetModule(moduleName),
    };
  }

  // Without moduleName, return full context (for cross-module access)
  return ctx;
}
