// The profile's editable fields: name and phone (the web's profile also edits the avatar and the password;
// those stay on the web). Same route as the web: `general-data/user/update-user`.
export interface ProfileValues {
  fullName: string;
  phone: string;
}

export interface ProfileErrors {
  fullName?: string;
  phone?: string;
}

export const PROFILE_NAME_MAX = 80;

// The phone as digits only: the server stores a number, so "+52 (55) 1234-5678" has to become 525512345678.
export function phoneDigits(text: string): string {
  return text.replace(/\D/g, "");
}

export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = values.fullName.trim();
  // The errors are catalog keys: the screen shows them with t(key, { p1 }), the maximum for the name's key.
  if (!name) errors.fullName = "profile.error.nameRequired";
  else if (name.length > PROFILE_NAME_MAX) errors.fullName = "profile.error.nameTooLong";
  const digits = phoneDigits(values.phone);
  if (values.phone.trim() !== "" && (digits.length < 7 || digits.length > 15)) errors.phone = "profile.error.phone";
  return errors;
}

// The body the route reads. An empty phone is left out: the server keeps the saved one (it cannot clear it).
export function buildProfileBody(values: ProfileValues): { fullName: string; phone?: string } {
  const digits = phoneDigits(values.phone);
  return digits ? { fullName: values.fullName.trim(), phone: digits } : { fullName: values.fullName.trim() };
}

export function profileToValues(user: { fullName?: string; phone?: number | string } | null | undefined): ProfileValues {
  return { fullName: user?.fullName ?? "", phone: user?.phone ? String(user.phone) : "" };
}

// "Ada Lovelace" -> "AL": the letters of the avatar when the account has no photo.
export function initialsOf(name: string | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
