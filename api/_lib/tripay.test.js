const crypto = require("crypto");

jest.mock("axios");
const axios = require("axios");

const PRIVATE_KEY = "test-private-key";
const MERCHANT_CODE = "T12345";
process.env.TRIPAY_PRIVATE_KEY = PRIVATE_KEY;
process.env.TRIPAY_MERCHANT_CODE = MERCHANT_CODE;
process.env.TRIPAY_GATEWAY_CREATE_URL = "https://gw.example/create";
process.env.TRIPAY_GATEWAY_CANCEL_URL = "https://gw.example/cancel";

const {
  createTripaySignature,
  resolveTripayMethod,
  verifyTripayCallback,
  mapStatus,
  normalizeTripayResponse,
  createTripayTransaction,
  cancelTripayTransaction,
} = require("./tripay");

describe("pembayaran Tripay", () => {
  beforeEach(() => {
    axios.post.mockReset();
  });

  test("signature transaksi berupa hex 64 karakter", () => {
    const signature = createTripaySignature("INV-001", 50000);
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  test("signature cocok dengan HMAC SHA256 merchant + ref + nominal", () => {
    const expected = crypto
      .createHmac("sha256", PRIVATE_KEY)
      .update(`${MERCHANT_CODE}INV-001${50000}`)
      .digest("hex");
    expect(createTripaySignature("INV-001", 50000)).toBe(expected);
  });

  test("signature berbeda untuk merchant ref berbeda", () => {
    expect(createTripaySignature("INV-001", 50000)).not.toBe(
      createTripaySignature("INV-002", 50000)
    );
  });

  test("metode QRIS dipetakan ke QRIS", () => {
    expect(resolveTripayMethod("qris")).toBe("QRIS");
  });

  test("bank transfer dipetakan ke kode channel Tripay", () => {
    expect(resolveTripayMethod("bank_transfer", "bca")).toBe("BCAVA");
    expect(resolveTripayMethod("bank_transfer", "bni")).toBe("BNIVA");
    expect(resolveTripayMethod("bank_transfer", "bri")).toBe("BRIVA");
    expect(resolveTripayMethod("bank_transfer", "mandiri")).toBe("MANDIRIVA");
    expect(resolveTripayMethod("bank_transfer", "bsi")).toBe("BSIVA");
    expect(resolveTripayMethod("bank_transfer", "permata")).toBe("PERMATAVA");
  });

  test("bank tidak dikenal memakai BCAVA sebagai default", () => {
    expect(resolveTripayMethod("bank_transfer", "bank-lain")).toBe("BCAVA");
    expect(resolveTripayMethod("bank_transfer")).toBe("BCAVA");
  });

  test("status callback Tripay dipetakan ke status internal", () => {
    expect(mapStatus("PAID")).toBe("paid");
    expect(mapStatus("UNPAID")).toBe("pending");
    expect(mapStatus("PENDING")).toBe("pending");
    expect(mapStatus("EXPIRED")).toBe("expired");
    expect(mapStatus("FAILED")).toBe("failed");
    expect(mapStatus("REFUND")).toBe("refunded");
    expect(mapStatus("CANCEL")).toBe("canceled");
  });

  test("status tidak dikenal dikembalikan huruf kecil", () => {
    expect(mapStatus("SETTLED")).toBe("settled");
  });

  test("status kosong dianggap pending", () => {
    expect(mapStatus("")).toBe("pending");
  });

  test("callback valid jika signature cocok dengan raw body", () => {
    const body = { merchant_ref: "INV-001", status: "PAID" };
    const raw = JSON.stringify(body);
    const signature = crypto
      .createHmac("sha256", PRIVATE_KEY)
      .update(raw)
      .digest("hex");

    expect(verifyTripayCallback(body, { "x-callback-signature": signature }, raw)).toBe(true);
  });

  test("callback valid jika signature dikirim lewat header", () => {
    const body = { merchant_ref: "INV-001", status: "PAID" };
    const signature = crypto
      .createHmac("sha256", PRIVATE_KEY)
      .update(JSON.stringify(body))
      .digest("hex");

    expect(verifyTripayCallback(body, { "x-callback-signature": signature })).toBe(true);
  });

  test("callback ditolak jika signature tidak cocok", () => {
    const body = { merchant_ref: "INV-001", status: "PAID" };
    expect(verifyTripayCallback(body, {}, "raw-body")).toBe(false);
  });

  test("callback ditolak jika signature tidak ada", () => {
    expect(verifyTripayCallback({ merchant_ref: "INV-001" }, {}, "")).toBe(false);
  });

  test("respons Tripay dinormalisasi ke model order internal", () => {
    const result = normalizeTripayResponse(
      {
        reference: "REF-001",
        pay_code: "1234567890",
        payment_name: "BCA Virtual Account",
        checkout_url: "https://tripay.example/pay",
        expired_time: 1700000000,
        status: "UNPAID",
      },
      {
        eventId: "kajian-001",
        eventTitle: "Kajian Akhir Pekan",
        paymentType: "bank_transfer",
        bank: "bca",
        method: "BCAVA",
        merchantRef: "INV-001",
        amount: 50000,
        ticketType: "regular",
      }
    );

    expect(result.orderId).toBe("INV-001");
    expect(result.reference).toBe("REF-001");
    expect(result.vaNumber).toBe("1234567890");
    expect(result.status).toBe("UNPAID");
    expect(result.expiresAt).toBe(new Date(1700000000 * 1000).toISOString());
  });

  test("pembayaran QRIS menyimpan qr string dan tidak mengisi VA", () => {
    const result = normalizeTripayResponse(
      {
        reference: "REF-002",
        qr_string: "QR-STRING-001",
        status: "UNPAID",
      },
      {
        eventId: "kajian-001",
        paymentType: "qris",
        method: "QRIS",
        merchantRef: "INV-002",
        amount: 50000,
      }
    );

    expect(result.vaNumber).toBeNull();
    expect(result.qrString).toBe("QR-STRING-001");
    expect(result.method).toBe("QRIS");
  });

  test("createTripayTransaction mengirim payload ke gateway", async () => {
    axios.post.mockResolvedValue({ data: { reference: "REF-003" } });

    const payload = { amount: 50000, merchant_ref: "INV-003" };
    const result = await createTripayTransaction(payload);

    expect(axios.post).toHaveBeenCalledWith(
      "https://gw.example/create",
      payload,
      expect.objectContaining({ timeout: 15000 })
    );
    expect(result).toEqual({ reference: "REF-003" });
  });

  test("cancelTripayTransaction mengirim reference ke gateway cancel", async () => {
    axios.post.mockResolvedValue({ data: { ok: true } });

    const result = await cancelTripayTransaction({ reference: "REF-003" });

    expect(axios.post).toHaveBeenCalledWith(
      "https://gw.example/cancel",
      { reference: "REF-003" },
      expect.objectContaining({ timeout: 15000 })
    );
    expect(result).toEqual({ ok: true });
  });

  test("cancelTripayTransaction menolak tanpa reference", async () => {
    await expect(cancelTripayTransaction({})).rejects.toThrow(
      "reference atau merchantRef wajib"
    );
  });
});
