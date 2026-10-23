const { validateRegistration, MIN_PASSWORD_LENGTH } = require("../src/utils/registrationValidator");

describe("validasi pendaftaran akun", () => {
  const valid = { name: "Reno", email: "reno@gmail.com", password: "rahasiaku123" };

  test("lolos jika nama, email Gmail valid, dan password >= 6", () => {
    const result = validateRegistration(valid);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("gagal jika email bukan Gmail (misal Yahoo)", () => {
    const result = validateRegistration({ ...valid, email: "reno@yahoo.com" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pendaftaran hanya untuk alamat Gmail");
  });

  test("gagal jika email bukan Gmail (misal Outlook)", () => {
    const result = validateRegistration({ ...valid, email: "reno@outlook.com" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pendaftaran hanya untuk alamat Gmail");
  });

  test("gagal jika format email tidak valid", () => {
    const result = validateRegistration({ ...valid, email: "reno" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Format email tidak valid");
  });

  test("gagal jika email kosong", () => {
    const result = validateRegistration({ ...valid, email: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Email wajib diisi");
  });

  test(`gagal jika password kurang dari ${MIN_PASSWORD_LENGTH} karakter`, () => {
    const result = validateRegistration({ ...valid, password: "12345" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password minimal 6 karakter");
  });

  test("lolos jika password tepat 6 karakter", () => {
    const result = validateRegistration({ ...valid, password: "123456" });
    expect(result.valid).toBe(true);
  });

  test("gagal jika password kosong", () => {
    const result = validateRegistration({ ...valid, password: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Password wajib diisi");
  });

  test("gagal jika nama kosong", () => {
    const result = validateRegistration({ ...valid, name: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Nama wajib diisi");
  });
});