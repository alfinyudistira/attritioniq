import React, { createContext, useState, useContext } from "react";

// Data yang scalable: siap multiuser, multi company, multi preference
const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [profile, setProfile] = useState(null); // data user/company/info utama
  const [settings, setSettings] = useState({
    currency: "IDR",
    locale: "id-ID",
    theme: "light",
    // tambahkan preference lain di sini
  });

  // Fungsi update, reset, dsb
  const updateProfile = (data) => setProfile(data);
  const updateSettings = (data) =>
    setSettings((prev) => ({ ...prev, ...data }));

  const resetAll = () => {
    setProfile(null);
    setSettings({
      currency: "IDR",
      locale: "id-ID",
      theme: "light",
    });
  };

  return (
    <GlobalContext.Provider
      value={{
        profile,
        setProfile: updateProfile,
        settings,
        setSettings: updateSettings,
        resetAll,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);