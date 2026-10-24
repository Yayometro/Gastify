import type profile from "../es/profile";

// English for the "profile" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof profile, string> = {
  "profile.pwdMismatch": "Passwords don't match, review both fields and try again ❌",
  "profile.pwdMin8": "Password should have at least 8 characters ❌",
  "profile.pwdUpper": "Password should have at least one capital letter \"A,B,C... etc\" ❌",
  "profile.pwdSpecial": "Password should have at least one special character \"!@#$%^&*(),.?\":_{}|<>\" ❌",
  "profile.noUserData": "Oops! No user data. Please refresh the page or try again later... 🤕",
  "profile.primaryCurrencyChanged": "Primary currency changed to {p1} 🤓",
  "profile.error.nameRequired": "Enter your name.",
  "profile.error.nameTooLong": "Maximum {p1} characters.",
  "profile.error.phone": "Enter a phone number of 7 to 15 digits.",
  "profile.avatar.saved": "Your new avatar was successfully uploaded into our database, now SAVE THE CHANGES to finally apply changes 🤓",
  "profile.toggle.off": "Off",
  "profile.fullName.label": "Full name:",
  "profile.mail.label": "Mail:",
  "profile.password.label": "Password:",
  "profile.image.label": "Image:",
  "profile.phone.label": "Phone:",
  "profile.changePassword.label": "Change password?:",
  "profile.password.placeholder": "Enter the password",
  "profile.confirmPassword.label": "Confirm password:",
  "profile.image.upload": "Upload an image"
};

export default en;
