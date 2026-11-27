const {
  matchesQuery,
  matchesCategory,
  isEventSoldOut,
} = require("../src/utils/eventFilter");

const event = {
  title: "Kajian Akhir Pekan",
  tagline: "Menjaga hati",
  description: "Kajian rutin tentang ketenangan jiwa",
  speaker: "Ustadz Ahmad",
  category: "Kajian",
  location: "Masjid Al-Ikhlas",
};

describe("pencarian dan filter daftar event", () => {
  test("cocok jika kata kunci ada di judul", () => {
    expect(matchesQuery(event, "akhir pekan")).toBe(true);
  });

  test("cocok jika kata kunci ada di nama pemateri", () => {
    expect(matchesQuery(event, "ustadz ahmad")).toBe(true);
  });

  test("cocok jika kata kunci ada di lokasi", () => {
    expect(matchesQuery(event, "masjid")).toBe(true);
  });

  test("pencarian tidak membedakan huruf besar/kecil", () => {
    expect(matchesQuery(event, "KAJIAN")).toBe(true);
  });

  test("kata kunci kosong mengembalikan semua event", () => {
    expect(matchesQuery(event, "")).toBe(true);
    expect(matchesQuery(event, "   ")).toBe(true);
  });

  test("tidak cocok jika kata kunci tidak ditemukan", () => {
    expect(matchesQuery(event, "sholawatan")).toBe(false);
  });

  test("filter kategori cocok persis", () => {
    expect(matchesCategory(event, "Kajian")).toBe(true);
  });

  test("filter kategori tidak membedakan huruf besar/kecil", () => {
    expect(matchesCategory(event, "kajian")).toBe(true);
  });

  test("kategori kosong mengembalikan semua event", () => {
    expect(matchesCategory(event, "")).toBe(true);
  });

  test("kategori berbeda tidak cocok", () => {
    expect(matchesCategory(event, "Sholawatan")).toBe(false);
  });
});

describe("deteksi event sold out", () => {
  test("sold out jika flag soldOut bernilai true", () => {
    expect(isEventSoldOut({ ...event, soldOut: true })).toBe(true);
  });

  test("sold out jika status tiket closed", () => {
    expect(isEventSoldOut({ ...event, ticketStatus: "closed" })).toBe(true);
  });

  test("sold out jika kursi terpakai mencapai kapasitas", () => {
    expect(isEventSoldOut({ ...event, capacity: 100, seatsUsed: 100 })).toBe(true);
  });

  test("sold out jika kuota reguler habis dan tidak ada VIP", () => {
    expect(
      isEventSoldOut({ ...event, quotaRegular: 50, seatsUsedRegular: 50 })
    ).toBe(true);
  });

  test("sold out jika kuota reguler dan VIP sama-sama habis", () => {
    expect(
      isEventSoldOut({
        ...event,
        quotaRegular: 50,
        seatsUsedRegular: 50,
        quotaVip: 10,
        seatsUsedVip: 10,
        priceVip: 100000,
      })
    ).toBe(true);
  });

  test("belum sold out jika kuota VIP masih tersedia", () => {
    expect(
      isEventSoldOut({
        ...event,
        quotaRegular: 50,
        seatsUsedRegular: 50,
        quotaVip: 10,
        seatsUsedVip: 4,
        priceVip: 100000,
      })
    ).toBe(false);
  });

  test("belum sold out jika kursi masih tersedia", () => {
    expect(isEventSoldOut({ ...event, capacity: 100, seatsUsed: 40 })).toBe(false);
  });

  test("event kosong tidak dianggap sold out", () => {
    expect(isEventSoldOut()).toBe(false);
  });
});
