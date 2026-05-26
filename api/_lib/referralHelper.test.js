const { checkReferralCode, checkDiscount, validateReferral } = require('./referralHelper');

describe('referral code validation', () => {
  test('kode valid jika formatnya benar', () => {
    const result = checkReferralCode('PROMO123');
    expect(result.ok).toBe(true);
  });

  test('kosong = invalid', () => {
    const result = checkReferralCode('');
    expect(result.ok).toBe(false);
  });

  test('null = invalid', () => {
    const result = checkReferralCode(null);
    expect(result.ok).toBe(false);
  });

  test('undefined = invalid', () => {
    const result = checkReferralCode(undefined);
    expect(result.ok).toBe(false);
  });

  test('hanya spasi = invalid', () => {
    const result = checkReferralCode('   ');
    expect(result.ok).toBe(false);
  });

  test('terlalu pendek dari 3 karakter', () => {
    const result = checkReferralCode('AB');
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('pendek');
  });

  test('persis 3 karakter = valid', () => {
    const result = checkReferralCode('ABC');
    expect(result.ok).toBe(true);
  });

  test('tidak boleh ada spasi di tengah', () => {
    const result = checkReferralCode('PROMO 123');
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('spasi');
  });

  test('spasi di depan/belakang ok (di-trim)', () => {
    const result = checkReferralCode('  PROMO123  ');
    expect(result.ok).toBe(true);
  });

  test('bukan string = invalid', () => {
    const result = checkReferralCode(123);
    expect(result.ok).toBe(false);
  });
});

describe('discount validation', () => {
  test('diskon 50 = valid', () => {
    const result = checkDiscount(50);
    expect(result.ok).toBe(true);
  });

  test('diskon 0 = valid', () => {
    const result = checkDiscount(0);
    expect(result.ok).toBe(true);
  });

  test('diskon 100 = valid', () => {
    const result = checkDiscount(100);
    expect(result.ok).toBe(true);
  });

  test('diskon dengan decimal = valid', () => {
    const result = checkDiscount(25.5);
    expect(result.ok).toBe(true);
  });

  test('diskon minus = invalid', () => {
    const result = checkDiscount(-5);
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('minus');
  });

  test('diskon besar minus = invalid', () => {
    const result = checkDiscount(-50);
    expect(result.ok).toBe(false);
  });

  test('diskon > 100 = invalid', () => {
    const result = checkDiscount(101);
    expect(result.ok).toBe(false);
    expect(result.msg).toContain('100');
  });

  test('diskon jauh diatas 100 = invalid', () => {
    const result = checkDiscount(200);
    expect(result.ok).toBe(false);
  });

  test('string bukan number = invalid', () => {
    const result = checkDiscount('50');
    expect(result.ok).toBe(false);
  });

  test('NaN = invalid', () => {
    const result = checkDiscount(NaN);
    expect(result.ok).toBe(false);
  });
});

describe('validasi referral lengkap', () => {
  test('kode dan diskon valid = ok', () => {
    const result = validateReferral('PROMO2024', 30);
    expect(result.valid).toBe(true);
    expect(result.data.code).toBe('PROMO2024');
    expect(result.data.discount).toBe(30);
  });

  test('kode kosong = error', () => {
    const result = validateReferral('', 50);
    expect(result.valid).toBe(false);
  });

  test('diskon minus = error', () => {
    const result = validateReferral('PROMO2024', -10);
    expect(result.valid).toBe(false);
  });

  test('diskon > 100 = error', () => {
    const result = validateReferral('PROMO2024', 150);
    expect(result.valid).toBe(false);
  });

  test('keduanya salah = return error kode dulu', () => {
    const result = validateReferral('', -50);
    expect(result.valid).toBe(false);
  });
});
