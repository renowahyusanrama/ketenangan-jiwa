const {
  REFERRAL_LIMIT,
  getReferralUsageCount,
  applyReferralUsage,
  resolveReferralPrice,
  normalizeReferralCode,
  normalizeEmail,
} = require("./referral");

function makeDbStub(count) {
  const snap = { data: () => (count === undefined ? undefined : { count }) };
  const useDoc = { get: async () => snap };
  const usesCol = { doc: () => useDoc };
  const refDoc = { collection: () => usesCol };
  const referralsCol = { doc: () => refDoc };
  return { collection: () => referralsCol };
}

function makeFakeDb(initial = {}) {
  const data = new Map(Object.entries(initial));
  const makeRef = (path) => ({
    path,
    collection: (name) => makeRef(`${path}/${name}`),
    doc: (id) => makeRef(`${path}/${id}`),
  });
  return {
    data,
    collection: (name) => makeRef(name),
    runTransaction: async (callback) => {
      const tx = {
        get: async (ref) => ({ data: () => data.get(ref.path), exists: data.has(ref.path) }),
        set: (ref, value, options) => {
          const previous = options && options.merge ? data.get(ref.path) || {} : {};
          data.set(ref.path, { ...previous, ...value });
        },
      };
      return callback(tx);
    },
  };
}

describe("getReferralUsageCount dengan Stub", () => {
  test("mengembalikan jumlah pemakaian dari data Firestore", async () => {
    const db = makeDbStub(3);

    const result = await getReferralUsageCount(db, "PROMO10", "reno@gmail.com");

    expect(result).toBe(3);
  });

  test("mengembalikan 0 jika dokumen pemakaian belum ada", async () => {
    const db = makeDbStub(undefined);

    const result = await getReferralUsageCount(db, "PROMO10", "reno@gmail.com");

    expect(result).toBe(0);
  });

  test("tidak membaca database jika kode referral kosong", async () => {
    const db = makeDbStub(3);

    const result = await getReferralUsageCount(db, "", "reno@gmail.com");

    expect(result).toBe(0);
  });
});

describe("getReferralUsageCount dengan Spy", () => {
  test("membaca dokumen uses dengan id email yang di-encode", async () => {
    const get = jest.fn(async () => ({ data: () => ({ count: 1 }) }));
    const useDoc = { get };
    const usesDoc = jest.fn(() => useDoc);
    const usesCol = { doc: usesDoc };
    const refDoc = { collection: jest.fn(() => usesCol) };
    const referralsDoc = jest.fn(() => refDoc);
    const collection = jest.fn(() => ({ doc: referralsDoc }));
    const db = { collection };

    await getReferralUsageCount(db, "promo10", "reno+tes@gmail.com");

    expect(collection).toHaveBeenCalledWith("referrals");
    expect(referralsDoc).toHaveBeenCalledWith("promo10");
    expect(refDoc.collection).toHaveBeenCalledWith("uses");
    expect(usesDoc).toHaveBeenCalledWith(encodeURIComponent("reno+tes@gmail.com"));
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe("applyReferralUsage dengan Dummy", () => {
  const dbDummy = {
    collection: () => {
      throw new Error("database tidak boleh diakses");
    },
  };

  test("tidak menyentuh database jika kode referral kosong", async () => {
    await expect(
      applyReferralUsage(dbDummy, "", "reno@gmail.com", { id: "order-1" }, {}),
    ).resolves.toBeUndefined();
  });

  test("tidak menyentuh database jika email kosong", async () => {
    await expect(
      applyReferralUsage(dbDummy, "PROMO10", "", { id: "order-1" }, {}),
    ).resolves.toBeUndefined();
  });

  test("tidak menyentuh database jika referensi order kosong", async () => {
    await expect(
      applyReferralUsage(dbDummy, "PROMO10", "reno@gmail.com", null, {}),
    ).resolves.toBeUndefined();
  });
});

describe("applyReferralUsage dengan Fake", () => {
  test("mencatat pemakaian pertama dan menandai order memakai referral", async () => {
    const db = makeFakeDb();
    const orderRef = db.collection("orders").doc("order-1");

    await applyReferralUsage(db, "PROMO10", "reno@gmail.com", orderRef, { code: "PROMO10" });

    expect(db.data.get("referrals/PROMO10/uses/reno%40gmail.com").count).toBe(1);
    expect(db.data.get(`orders/order-1`).referral.usageApplied).toBe(true);
    expect(db.data.get(`orders/order-1`).referral.usageCount).toBe(1);
  });

  test("menolak pemakaian jika sudah mencapai batas", async () => {
    const db = makeFakeDb({
      "referrals/PROMO10/uses/reno%40gmail.com": { count: REFERRAL_LIMIT },
    });
    const orderRef = db.collection("orders").doc("order-2");

    await applyReferralUsage(db, "PROMO10", "reno@gmail.com", orderRef, { code: "PROMO10" });

    expect(db.data.get("referrals/PROMO10/uses/reno%40gmail.com").count).toBe(REFERRAL_LIMIT);
    expect(db.data.get("orders/order-2").referral.usageApplied).toBe(false);
    expect(db.data.get("orders/order-2").referral.usageError).toBe("limit");
  });
});

describe("helper murni kode referral", () => {
  test("menormalkan kode referral menjadi huruf besar tanpa spasi tepi", () => {
    expect(normalizeReferralCode("  promo10 ")).toBe("PROMO10");
  });

  test("kode referral kosong dinormalkan menjadi string kosong", () => {
    expect(normalizeReferralCode(undefined)).toBe("");
    expect(normalizeReferralCode(null)).toBe("");
  });

  test("menormalkan email menjadi huruf kecil", () => {
    expect(normalizeEmail(" Reno@Gmail.com ")).toBe("reno@gmail.com");
  });

  test("email kosong dinormalkan menjadi string kosong", () => {
    expect(normalizeEmail(undefined)).toBe("");
  });

  test("mengembalikan null jika data referral tidak ada", () => {
    expect(resolveReferralPrice(null, "regular")).toBeNull();
  });

  test("harga dipakai jika batas tiket tidak ditentukan", () => {
    expect(resolveReferralPrice({ regularPriceAfter: 45000 }, "regular")).toBe(45000);
  });

  test("mengembalikan null jika referral tidak berlaku untuk tipe tiket", () => {
    const data = { appliesTo: "regular", regularPriceAfter: 45000 };

    expect(resolveReferralPrice(data, "vip")).toBeNull();
  });

  test("mengembalikan harga setelah diskon untuk tipe tiket yang sesuai", () => {
    const data = { appliesTo: "both", regularPriceAfter: "45000", vipPriceAfter: 75000 };

    expect(resolveReferralPrice(data, "regular")).toBe(45000);
    expect(resolveReferralPrice(data, "vip")).toBe(75000);
  });

  test("harga dipakai jika tipe tiket sama dengan batas referral", () => {
    const data = { appliesTo: "vip", vipPriceAfter: 75000 };

    expect(resolveReferralPrice(data, "vip")).toBe(75000);
  });

  test("mengembalikan null jika harga setelah diskon tidak valid", () => {
    expect(resolveReferralPrice({ regularPriceAfter: -1 }, "regular")).toBeNull();
    expect(resolveReferralPrice({ regularPriceAfter: "abc" }, "regular")).toBeNull();
  });
});