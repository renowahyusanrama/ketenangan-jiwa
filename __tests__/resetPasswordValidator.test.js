const { validateResetEmail } = require("../src/utils/resetPasswordValidator");

describe("validasi email lupa password", () => {
  test("lolos jika email valid", () => {
    const result = validateResetEmail("reno@gmail.com");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("gagal jika email kosong", () => {
    const result = validateResetEmail("");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Email wajib diisi");
  });

  test("gagal jika email hanya berisi spasi", () => {
    const result = validateResetEmail("   ");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Email wajib diisi");
  });

  test("gagal jika format email tidak valid", () => {
    const result = validateResetEmail("reno-at-gmail");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Format email tidak valid");
  });

  test("email dengan spasi di awal/akhir tetap dinormalisasi", () => {
    const result = validateResetEmail("  reno@gmail.com ");
    expect(result.valid).toBe(true);
  });

  test("gagal jika dipanggil tanpa argumen", () => {
    const result = validateResetEmail();
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Email wajib diisi"]);
  });
});
