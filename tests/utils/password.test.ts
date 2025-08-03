import { hashPassword, comparePassword, validatePassword } from '../../src/utils/password';

describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const password = 'password123';
    const hashedPassword = await hashPassword(password);
    expect(hashedPassword).not.toBe(password);
  });

  it('should compare a password with a hash', async () => {
    const password = 'password123';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const password = 'password123';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword('wrongpassword', hashedPassword);
    expect(isMatch).toBe(false);
  });

  it('should validate a strong password', () => {
    const result = validatePassword('Password123!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should invalidate a weak password', () => {
    const result = validatePassword('pass');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });
});
