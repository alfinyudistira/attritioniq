// Bikin flag sample data per modul
export const SAMPLE_ACTIVE_KEY = (modul) => `attritioniq.sample.${modul}`;

export function setSampleActive(modul, aktif = true) {
  localStorage.setItem(SAMPLE_ACTIVE_KEY(modul), aktif ? "1" : "0");
}

export function isSampleActive(modul) {
  return localStorage.getItem(SAMPLE_ACTIVE_KEY(modul)) === "1";
}

export function clearSampleData(modul) {
  setSampleActive(modul, false);
  // Tambah logic hapus data sample terkait (bukan data user)
}