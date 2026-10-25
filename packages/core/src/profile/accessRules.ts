// The functions return the catalog key of the problem (the caller translates it), or null.
// The rules for the two things the profile changes about how someone signs in: the e-mail and the password.
// They are the web's: a password of at least 8 characters with a capital letter and a special character.
export const PASSWORD_MIN_LENGTH = 8;
const CAPITAL = /[A-Z]/;
const SPECIAL = /[!@#$%^&*(),.?":_{}|<>]/;

export function validateNewPassword(password: string, confirm: string): string | null {
  if (password !== confirm) return "profile.error.passwordMismatch";
  if (password.length < PASSWORD_MIN_LENGTH) return "auth.password.ruleLength";
  if (!CAPITAL.test(password)) return "auth.password.ruleUppercase";
  if (!SPECIAL.test(password)) return "profile.error.passwordSpecial";
  return null;
}

export function validateEmailAddress(email: string, current: string): string | null {
  const text = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) return "profile.error.mailInvalid";
  if (text.toLowerCase() === current.trim().toLowerCase()) return "profile.error.mailSame";
  return null;
}
