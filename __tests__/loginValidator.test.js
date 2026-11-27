const { validateLogin, MIN_PASSWORD_LENGTH } = require("../src/utils/loginValidator");

describe("validasi login akun", () => {
  const valid = { email: "reno@gmail.com", password: "rahasiaku123" };

  test("lolos jika email valid dan password memenuhi panjang minimum", () => {
    const result = validateLogin(valid);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("gagal jika email kosong", () => {
    const result = validateLogin({ ...valid, email: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Email wajib diisi");
  });

  test("gagal jika format email tidak valid", () => {
    const result = validateLogin({ ...valid, email: "reno" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Format email tidak valid");
  });

  test("gagal jika password kosong", () => {
    const result = validateLogin({ ...valid, password: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password wajib diisi");
  });

  test(`gagal jika password kurang dari ${MIN_PASSWORD_LENGTH} karakter`, () => {
    const result = validateLogin({ ...valid, password: "12345" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password minimal 6 karakter");
  });

  test("lolos jika password tepat 6 karakter", () => {
    const result = validateLogin({ ...valid, password: "123456" });
    expect(result.valid).toBe(true);
  });

  test("email dengan spasi di awal/akhir tetap dinormalisasi", () => {
    const result = validateLogin({ ...valid, email: "  reno@gmail.com  " });
    expect(result.valid).toBe(true);
  });

  test("gagal jika dipanggil tanpa argumen (email dan password kosong)", () => {
    const result = validateLogin();
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Email wajib diisi", "Password wajib diisi"]);
  });
});
