const { cekKodeReferral, cekDiskon, validasiReferral } = require('./referralHelper');

describe('validasi kode referral', () => {
  test('kode valid jika formatnya benar', () => {
    const result = cekKodeReferral('PROMO123');
    expect(result.ok).toBe(true);
  });

  test('kosong = tidak valid', () => {
    const result = cekKodeReferral('');
    expect(result.ok).toBe(false);
  });

  test('null = tidak valid', () => {
    const result = cekKodeReferral(null);
    expect(result.ok).toBe(false);
  });

  test('undefined = tidak valid', () => {
    const result = cekKodeReferral(undefined);
    expect(result.ok).toBe(false);
  });

  test('hanya spasi = tidak valid', () => {
    const result = cekKodeReferral('   ');
    expect(result.ok).toBe(false);
  });

  test('kurang dari 3 karakter = tidak valid', () => {
    const result = cekKodeReferral('AB');
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('pendek');
  });

  test('tepat 3 karakter = valid', () => {
    const result = cekKodeReferral('ABC');
    expect(result.ok).toBe(true);
  });

  test('ada spasi di tengah = tidak valid', () => {
    const result = cekKodeReferral('PROMO 123');
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('spasi');
  });

  test('spasi di awal/akhir = valid (otomatis di-trim)', () => {
    const result = cekKodeReferral('  PROMO123  ');
    expect(result.ok).toBe(true);
  });

  test('bukan string = tidak valid', () => {
    const result = cekKodeReferral(123);
    expect(result.ok).toBe(false);
  });
});

describe('validasi diskon', () => {
  test('diskon 50 = valid', () => {
    const result = cekDiskon(50);
    expect(result.ok).toBe(true);
  });

  test('diskon 0 = valid', () => {
    const result = cekDiskon(0);
    expect(result.ok).toBe(true);
  });

  test('diskon 100 = valid', () => {
    const result = cekDiskon(100);
    expect(result.ok).toBe(true);
  });

  test('diskon dengan desimal = valid', () => {
    const result = cekDiskon(25.5);
    expect(result.ok).toBe(true);
  });

  test('diskon minus = tidak valid', () => {
    const result = cekDiskon(-5);
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('minus');
  });

  test('diskon besar minus = tidak valid', () => {
    const result = cekDiskon(-50);
    expect(result.ok).toBe(false);
  });

  test('diskon > 100 = tidak valid', () => {
    const result = cekDiskon(101);
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('100');
  });

  test('diskon jauh lebih dari 100 = tidak valid', () => {
    const result = cekDiskon(200);
    expect(result.ok).toBe(false);
  });

  test('string bukan number = tidak valid', () => {
    const result = cekDiskon('50');
    expect(result.ok).toBe(false);
  });

  test('NaN = tidak valid', () => {
    const result = cekDiskon(NaN);
    expect(result.ok).toBe(false);
  });
});

describe('validasi referral lengkap', () => {
  test('kode dan diskon keduanya valid = ok', () => {
    const result = validasiReferral('PROMO2024', 30);
    expect(result.valid).toBe(true);
    expect(result.data.kode).toBe('PROMO2024');
    expect(result.data.diskon).toBe(30);
  });

  test('kode kosong = gagal', () => {
    const result = validasiReferral('', 50);
    expect(result.valid).toBe(false);
  });

  test('diskon minus = gagal', () => {
    const result = validasiReferral('PROMO2024', -10);
    expect(result.valid).toBe(false);
  });

  test('diskon > 100 = gagal', () => {
    const result = validasiReferral('PROMO2024', 150);
    expect(result.valid).toBe(false);
  });

  test('keduanya tidak valid = return error dari kode dulu', () => {
    const result = validasiReferral('', -50);
    expect(result.valid).toBe(false);
  });
});
