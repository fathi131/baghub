const { applyDiscount, MAX_DISCOUNT } = require('../../utils/discount');

describe('Discount Calculator — TDD Feature', () => {
  test('applies 10% discount', () => {
    expect(applyDiscount(1000, 10)).toBe(900);
  });

  test('applies 20% discount', () => {
    expect(applyDiscount(500, 20)).toBe(400);
  });

  test('returns price unchanged for 0% discount', () => {
    expect(applyDiscount(1000, 0)).toBe(1000);
  });

  test('returns 0 for invalid price', () => {
    expect(applyDiscount(-100, 10)).toBe(0);
    expect(applyDiscount(0, 10)).toBe(0);
  });

  test('caps discount at 50%', () => {
    expect(applyDiscount(1000, 60)).toBe(500);
    expect(applyDiscount(1000, 100)).toBe(500);
  });

  test('MAX_DISCOUNT constant is 50', () => {
    expect(MAX_DISCOUNT).toBe(50);
  });
});