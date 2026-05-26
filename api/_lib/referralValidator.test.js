/**
 * Unit Test untuk Referral Validator
 * Mata Kuliah: Design for Testability
 * Test menggunakan Jest
 */

const {
  validateReferralCode,
  validateReferralDiscount,
  validateReferral,
} = require("./referralValidator");

describe("Referral Validator - validateReferralCode", () => {
  test("harus valid jika kode referral terisi dan formatnya benar", () => {
    const result = validateReferralCode("PROMO2024");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("harus valid dengan kode singkat (3 karakter)", () => {
    const result = validateReferralCode("ABC");
    expect(result.valid).toBe(true);
  });

  test("harus valid dengan kode lowercase (akan diterima)", () => {
    const result = validateReferralCode("promo");
    expect(result.valid).toBe(true);
  });

  test("harus invalid jika kode kosong", () => {
    const result = validateReferralCode("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("kosong");
  });

  test("harus invalid jika kode null", () => {
    const result = validateReferralCode(null);
    expect(result.valid).toBe(false);
  });

  test("harus invalid jika kode undefined", () => {
    const result = validateReferralCode(undefined);
    expect(result.valid).toBe(false);
  });

  test("harus invalid jika kode hanya whitespace", () => {
    const result = validateReferralCode("   ");
    expect(result.valid).toBe(false);
  });

  test("harus invalid jika kode terlalu pendek (< 3 karakter)", () => {
    const result = validateReferralCode("AB");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("terlalu pendek");
  });

  test("harus invalid jika kode mengandung spasi di tengah", () => {
    const result = validateReferralCode("PROMO 2024");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("spasi");
  });

  test("harus invalid jika kode mengandung spasi di awal (setelah trim)", () => {
    const result = validateReferralCode("  PROMO");
    expect(result.valid).toBe(true); // karena di-trim dulu
  });

  test("harus invalid jika input bukan string", () => {
    const result = validateReferralCode(123);
    expect(result.valid).toBe(false);
  });
});

describe("Referral Validator - validateReferralDiscount", () => {
  test("harus valid jika diskon adalah angka 0-100", () => {
    const result = validateReferralDiscount(50);
    expect(result.valid).toBe(true);
  });

  test("harus valid jika diskon adalah 0", () => {
    const result = validateReferralDiscount(0);
    expect(result.valid).toBe(true);
  });

  test("harus valid jika diskon adalah 100", () => {
    const result = validateReferralDiscount(100);
    expect(result.valid).toBe(true);
  });

  test("harus valid dengan diskon decimal", () => {
    const result = validateReferralDiscount(25.5);
    expect(result.valid).toBe(true);
  });

  test("harus invalid jika diskon negatif", () => {
    const result = validateReferralDiscount(-10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("negatif");
  });

  test("harus invalid jika diskon minus besar", () => {
    const result = validateReferralDiscount(-99);
    expect(result.valid).toBe(false);
  });

  test("harus invalid jika diskon lebih dari 100%", () => {
    const result = validateReferralDiscount(101);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("lebih dari 100");
  });

  test("harus invalid jika diskon jauh lebih dari 100%", () => {
    const result = validateReferralDiscount(999);
    expect(result.valid).toBe(false);
  });

  test("harus invalid jika input bukan number", () => {
    const result = validateReferralDiscount("50");
    expect(result.valid).toBe(false);
  });

  test("harus invalid jika input NaN", () => {
    const result = validateReferralDiscount(NaN);
    expect(result.valid).toBe(false);
  });
});

describe("Referral Validator - validateReferral (kombinasi)", () => {
  test("harus valid jika kode dan diskon keduanya valid", () => {
    const result = validateReferral("PROMO2024", 30);
    expect(result.valid).toBe(true);
    expect(result.details).toBeDefined();
    expect(result.details.code).toBe("PROMO2024");
    expect(result.details.discount).toBe(30);
  });

  test("harus invalid jika kode kosong (meski diskon valid)", () => {
    const result = validateReferral("", 50);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("kosong");
  });

  test("harus invalid jika diskon negatif (meski kode valid)", () => {
    const result = validateReferral("PROMO2024", -20);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("negatif");
  });

  test("harus invalid jika diskon lebih dari 100 (meski kode valid)", () => {
    const result = validateReferral("PROMO2024", 150);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("lebih dari 100");
  });

  test("harus invalid jika keduanya invalid (kode kosong dan diskon negatif)", () => {
    const result = validateReferral("", -50);
    expect(result.valid).toBe(false);
    // Akan menampilkan error kode kosong (dicek lebih dulu)
    expect(result.error).toBeDefined();
  });
});
