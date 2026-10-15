const MAX_DISCOUNT = 50;

const applyDiscount = (price, discountPercent) => {
  if (typeof price !== 'number' || price <= 0) return 0;
  if (typeof discountPercent !== 'number' || discountPercent <= 0) return price;

  const cappedDiscount = Math.min(discountPercent, MAX_DISCOUNT);
  const discountAmount = price * (cappedDiscount / 100);
  return Math.round(price - discountAmount);
};

module.exports = { applyDiscount, MAX_DISCOUNT };