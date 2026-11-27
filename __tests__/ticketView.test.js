const {
  formatCurrency,
  createQrUrl,
  buildInstructionsHtml,
} = require("../src/utils/ticketView");

describe("tampilan detail event dan tiket", () => {
  test("format rupiah untuk nominal ribuan", () => {
    const result = formatCurrency(50000);
    expect(result).toContain("50.000");
    expect(result).toContain("Rp");
  });

  test("nominal nol tetap diformat sebagai rupiah", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  test("nominal berupa string angka tetap diformat", () => {
    expect(formatCurrency("75000")).toContain("75.000");
  });

  test("QR URL kosong jika data QR tidak ada", () => {
    expect(createQrUrl("")).toBe("");
    expect(createQrUrl()).toBe("");
  });

  test("QR URL memakai layanan chart dan meng-encode isi QR", () => {
    const url = createQrUrl("TIKET-001&event=kajian");
    expect(url).toContain("chart.googleapis.com");
    expect(url).toContain("TIKET-001%26event%3Dkajian");
  });

  test("instruksi pembayaran kosong jika tidak ada data", () => {
    expect(buildInstructionsHtml([])).toBe("");
    expect(buildInstructionsHtml()).toBe("");
  });

  test("instruksi pembayaran membentuk daftar langkah", () => {
    const html = buildInstructionsHtml([
      { title: "Virtual Account", steps: ["Buka m-banking", "Masukkan kode VA"] },
    ]);
    expect(html).toContain("Virtual Account");
    expect(html).toContain("<li>Buka m-banking</li>");
    expect(html).toContain("<li>Masukkan kode VA</li>");
    expect(html).toContain("<ol>");
  });

  test("judul instruksi memakai fallback jika tidak diisi", () => {
    const html = buildInstructionsHtml([{ steps: ["Bayar"] }]);
    expect(html).toContain("Panduan pembayaran");
  });
});
