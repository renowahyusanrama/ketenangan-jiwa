const { validateEvent } = require("../src/utils/eventValidation");

describe("event validation", () => {
  const event = {
    title: "Kajian Akhir Pekan",
    date: "2026-06-01",
    price: 50000,
    quota: 25,
  };

  test("event valid kalau judul, tanggal, harga, dan kuota benar", () => {
    expect(validateEvent(event)).toBe(true);
  });

  test("invalid kalau judul kosong", () => {
    expect(validateEvent({ ...event, title: "" })).toBe(false);
  });

  test("invalid kalau tanggal kosong", () => {
    expect(validateEvent({ ...event, date: "" })).toBe(false);
  });

  test("invalid kalau harga minus", () => {
    expect(validateEvent({ ...event, price: -1 })).toBe(false);
  });

  test("invalid kalau kuota 0 atau minus", () => {
    expect(validateEvent({ ...event, quota: 0 })).toBe(false);
    expect(validateEvent({ ...event, quota: -1 })).toBe(false);
  });
});
