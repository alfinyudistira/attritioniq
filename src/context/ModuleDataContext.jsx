import React, { createContext, useContext, useState } from "react";

// Gunakan 1 context universal buat granular data tiap modul (namespace: modulName)
const ModuleDataContext = createContext();

export const ModuleDataProvider = ({ children }) => {
  // State utama: map of modulName → data
  const [modulesData, setModulesData] = useState({});

  const updateModule = (name, data) => setModulesData((prev) => ({
    ...prev,
    [name]: { ...prev[name], ...data },
  }));

  const resetModule = (name) => setModulesData((prev) => ({
    ...prev,
    [name]: {},
  }));

  const resetAllModules = () => setModulesData({});

  return (
    <ModuleDataContext.Provider value={{
      modulesData,
      updateModule,
      resetModule,
      resetAllModules,
    }}>
      {children}
    </ModuleDataContext.Provider>
  );
};

export const useModuleData = () => useContext(ModuleDataContext);