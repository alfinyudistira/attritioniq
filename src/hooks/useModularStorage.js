import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useModularStorage — Hybrid IndexedDB + localStorage storage for AttritionIQ
//
// Strategy:
//   • localStorage  → small config-like state (slider values, filters, booleans)
//                     Synchronous, instant, survives tab close.
//   • IndexedDB     → large data (bulk arrays, computed results, AI outputs)
//                     Async, higher quota (~50% disk), survives tab close.
//
// Session safety:
//   Both layers are keyed with dataSessionId. When a new CSV is uploaded,
//   the session ID changes → stale data from the previous CSV is never shown.
//
// TTL:
//   Entries older than TTL_MS (default 7 days) are treated as expired and
//   silently dropped, preventing stale data from accumulating indefinitely.
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME    = "attritioniq_idb";
const DB_VERSION = 1;
const IDB_STORE  = "module_data";
const LS_PREFIX  = "attritioniq.ls.";
const TTL_MS     = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── IndexedDB singleton ───────────────────────────────────────────────────────

let _dbPromise = null;

function getDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => {
      _dbPromise = null; // allow retry
      reject(e.target.error);
    };
  });
  return _dbPromise;
}

// ── IndexedDB public utilities (importable by any module) ─────────────────────

export async function idbSet(key, value) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const entry = { value, savedAt: Date.now() };
      const req   = store.put(entry, key);
      req.onsuccess = () => resolve(true);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn("[idbSet] IndexedDB write failed, falling back to localStorage:", err);
    try {
      localStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now() }));
      return true;
    } catch { return false; }
  }
}

export async function idbGet(key, ttlMs = TTL_MS) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req   = store.get(key);
      req.onsuccess = (e) => {
        const entry = e.target.result;
        if (!entry) { resolve(undefined); return; }
        // TTL check
        if (ttlMs > 0 && Date.now() - entry.savedAt > ttlMs) {
          // Expired — delete silently
          idbDelete(key);
          resolve(undefined);
          return;
        }
        resolve(entry.value);
      };
      req.onerror = () => resolve(undefined);
    });
  } catch (err) {
    console.warn("[idbGet] IndexedDB read failed, falling back to localStorage:", err);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return undefined;
      const entry = JSON.parse(raw);
      if (ttlMs > 0 && Date.now() - entry.savedAt > ttlMs) {
        localStorage.removeItem(key);
        return undefined;
      }
      return entry.value;
    } catch { return undefined; }
  }
}

export async function idbDelete(key) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req   = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror   = () => resolve(false);
    });
  } catch { return false; }
}

export async function idbClearPrefix(prefix) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req   = store.openCursor();
      const deleted = [];
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (String(cursor.key).startsWith(prefix)) {
            cursor.delete();
            deleted.push(cursor.key);
          }
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

// ── localStorage utilities (synchronous, for small config state) ──────────────

function lsSet(key, value, ttlMs = TTL_MS) {
  try {
    const entry = { value, savedAt: Date.now(), ttlMs };
    localStorage.setItem(key, JSON.stringify(entry));
    return true;
  } catch { return false; }
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw);
    // TTL check
    if (entry.ttlMs > 0 && Date.now() - entry.savedAt > entry.ttlMs) {
      localStorage.removeItem(key);
      return undefined;
    }
    return entry.value;
  } catch { return undefined; }
}

function lsDelete(key) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// useModularStorage
//
// Usage (localStorage, small state):
//   const [filters, setFilters, { clear }] = useModularStorage(
//     "m3_filters", defaultFilters, { dataSessionId, storage: "local" }
//   );
//
// Usage (IndexedDB, large data):
//   const [results, setResults, { clear, isLoading }] = useModularStorage(
//     "m3_results", [], { dataSessionId, storage: "idb" }
//   );
//
// Parameters:
//   key           — unique string key for this piece of state
//   defaultValue  — value to use when nothing is stored or session changes
//   options:
//     dataSessionId — (string) current CSV session ID from AppContext
//     storage       — "local" (default) | "idb"
//     ttlMs         — override TTL (default 7 days). 0 = no expiry.
// ─────────────────────────────────────────────────────────────────────────────

export function useModularStorage(key, defaultValue, options = {}) {
  const {
    dataSessionId = "",
    storage = "local",
    ttlMs = TTL_MS,
  } = options;

  const isIDB          = storage === "idb";
  const sessionedKey   = dataSessionId ? `${key}__${dataSessionId}` : key;
  const lsKey          = `${LS_PREFIX}${sessionedKey}`;
  const idbKey         = sessionedKey;

  const [state, setStateRaw] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(isIDB);
  const mountedRef   = useRef(true);
  const prevSessionRef = useRef(dataSessionId);

  // ── On mount: load from storage ──
  useEffect(() => {
    mountedRef.current = true;

    if (isIDB) {
      setIsLoading(true);
      idbGet(idbKey, ttlMs).then(stored => {
        if (!mountedRef.current) return;
        if (stored !== undefined) setStateRaw(stored);
        setIsLoading(false);
      });
    } else {
      const stored = lsGet(lsKey);
      if (stored !== undefined) setStateRaw(stored);
    }

    return () => { mountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session change: flush stale state, reset to default ──
  useEffect(() => {
    if (!dataSessionId) return;
    if (prevSessionRef.current === dataSessionId) return;

    // Session changed — wipe old data, restore default
    prevSessionRef.current = dataSessionId;
    setStateRaw(defaultValue);

    // Clean up old storage entry (best-effort, no await needed)
    if (isIDB) {
      idbDelete(idbKey);
    } else {
      // Remove all LS entries with the old session prefix
      try {
        const keysToDelete = Object.keys(localStorage)
          .filter(k => k.startsWith(`${LS_PREFIX}${key}__`));
        keysToDelete.forEach(k => localStorage.removeItem(k));
      } catch {}
    }
  }, [dataSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Setter: update state and persist ──
  const setState = useCallback((valOrUpdater) => {
    setStateRaw(prev => {
      const next = typeof valOrUpdater === "function" ? valOrUpdater(prev) : valOrUpdater;

      // Persist to correct storage layer
      if (isIDB) {
        idbSet(idbKey, next).catch(err =>
          console.warn("[useModularStorage] IDB persist failed:", err)
        );
      } else {
        lsSet(lsKey, next, ttlMs);
      }

      return next;
    });
  }, [isIDB, idbKey, lsKey, ttlMs]);

  // ── Clear: reset to default and wipe storage ──
  const clear = useCallback(() => {
    setStateRaw(defaultValue);
    if (isIDB) {
      idbDelete(idbKey);
    } else {
      lsDelete(lsKey);
    }
  }, [defaultValue, isIDB, idbKey, lsKey]);

  return [state, setState, { isLoading, clear }];
}

// ─────────────────────────────────────────────────────────────────────────────
// useIDBState — convenience wrapper specifically for IndexedDB
// Drop-in for useState but backed by IndexedDB with session safety.
//
// Usage:
//   const [aiOutput, setAiOutput, { isLoading, clear }] = useIDBState(
//     "m5_ai_output", null, dataSessionId
//   );
// ─────────────────────────────────────────────────────────────────────────────

export function useIDBState(key, defaultValue, dataSessionId = "") {
  return useModularStorage(key, defaultValue, {
    dataSessionId,
    storage: "idb",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useLocalState — convenience wrapper specifically for localStorage
// Drop-in for useState but persisted and session-safe.
//
// Usage:
//   const [filters, setFilters, { clear }] = useLocalState(
//     "m3_filters", defaultFilters, dataSessionId
//   );
// ─────────────────────────────────────────────────────────────────────────────

export function useLocalState(key, defaultValue, dataSessionId = "") {
  return useModularStorage(key, defaultValue, {
    dataSessionId,
    storage: "local",
  });
}
