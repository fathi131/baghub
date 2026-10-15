const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return strongRegex.test(password);
};

describe('Password Validation', () => {
  test('accepts strong password', () => {
    expect(isStrongPassword('Admin@1234')).toBe(true);
    expect(isStrongPassword('Test@2026')).toBe(true);
  });

  test('rejects short password', () => {
    expect(isStrongPassword('Ab@1')).toBe(false);
  });

  test('rejects password without uppercase', () => {
    expect(isStrongPassword('admin@1234')).toBe(false);
  });

  test('rejects password without special char', () => {
    expect(isStrongPassword('Admin1234')).toBe(false);
  });

  test('rejects empty or null', () => {
    expect(isStrongPassword('')).toBe(false);
    expect(isStrongPassword(null)).toBe(false);
  });
});