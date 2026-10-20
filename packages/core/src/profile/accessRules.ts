// The rules for the two things the profile changes about how someone signs in: the e-mail and the password.
// They are the web's: a password of at least 8 characters with a capital letter and a special character.
export const PASSWORD_MIN_LENGTH = 8;
const CAPITAL = /[A-Z]/;
const SPECIAL = /[!@#$%^&*(),.?":_{}|<>]/;

export function validateNewPassword(password: string, confirm: string): string | null {
  if (password !== confirm) return "Las contraseñas no coinciden. Revisa las dos y vuelve a intentar.";
  if (password.length < PASSWORD_MIN_LENGTH) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (!CAPITAL.test(password)) return "La contraseña debe tener al menos una letra mayúscula.";
  if (!SPECIAL.test(password)) return 'La contraseña debe tener al menos un carácter especial: !@#$%^&*(),.?":_{}|<>';
  return null;
}

export function validateEmailAddress(email: string, current: string): string | null {
  const text = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) return "Escribe un correo válido.";
  if (text.toLowerCase() === current.trim().toLowerCase()) return "Ese ya es tu correo.";
  return null;
}
