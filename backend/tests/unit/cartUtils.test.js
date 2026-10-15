const calculateCartTotal = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
};

describe('Cart Utility — calculateCartTotal', () => {
  test('calculates total for multiple items', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 }
    ];
    expect(calculateCartTotal(items)).toBe(350);
  });

  test('calculates total for single item', () => {
    expect(calculateCartTotal([{ price: 500, quantity: 1 }])).toBe(500);
  });

  test('returns 0 for empty cart', () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  test('returns 0 for null/undefined', () => {
    expect(calculateCartTotal(null)).toBe(0);
    expect(calculateCartTotal(undefined)).toBe(0);
  });
});