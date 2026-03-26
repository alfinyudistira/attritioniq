// Contoh function: detect field mapping dari sample CSV/data
export function autoMapFields(headers = [], template = []) {
  // Simple: case-insensitive, typo distance, dsb
  return template.map((wanted) => {
    // Cari header yang paling mirip/toleran
    const found = headers.find(
      (h) => h.toLowerCase().replace(/\W/g, "") ===
        wanted.toLowerCase().replace(/\W/g, "")
    );
    return found || null;
  });
}