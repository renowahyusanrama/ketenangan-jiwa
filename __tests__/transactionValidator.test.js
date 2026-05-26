const { validateTransaction } = require("../src/utils/transactionValidator");

const validTransaction = {
  userName: "Ahmad",
  eventId: "kajian-001",
  amount: 50000,
  paymentStatus: "pending",
};

describe("validasi transaksi pembayaran", () => {
  test("valid kalau nama user, id event, nominal, dan status pembayaran benar", () => {
    const result = validateTransaction(validTransaction);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("invalid kalau nama user kosong", () => {
    const result = validateTransaction({ ...validTransaction, userName: "" });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Nama user wajib diisi");
  });

  test("invalid kalau id event kosong", () => {
    const result = validateTransaction({ ...validTransaction, eventId: "" });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("ID event wajib diisi");
  });

  test("invalid kalau nominal pembayaran 0 atau minus", () => {
    expect(validateTransaction({ ...validTransaction, amount: 0 }).valid).toBe(false);
    expect(validateTransaction({ ...validTransaction, amount: -1000 }).valid).toBe(false);
  });

  test("invalid kalau status pembayaran kosong", () => {
    const result = validateTransaction({ ...validTransaction, paymentStatus: "" });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Status pembayaran wajib diisi");
  });

  test("invalid kalau status pembayaran bukan pending, success, atau failed", () => {
    const result = validateTransaction({ ...validTransaction, paymentStatus: "paid" });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Status pembayaran tidak valid");
  });
});
