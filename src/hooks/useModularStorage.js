import { useEffect } from "react";

// Universal modular storage by modulName (gunakan localStorage, bisa extend ke IndexedDB)
export function useModularStorage(modulName, state, setState) {
  // Load persisted data saat mount
  useEffect(() => {
    const key = `attritioniq.${modulName}`;
    const stored = localStorage.getItem(key);
    if (stored) setState(JSON.parse(stored));
  }, [modulName, setState]);

  // Auto-persist setiap perubahan state
  useEffect(() => {
    const key = `attritioniq.${modulName}`;
    if (state) localStorage.setItem(key, JSON.stringify(state));
  }, [modulName, state]);
}

// Untuk data besar, bisa tambahkan logic pakai IndexedDB (idb-keyval dsb)
