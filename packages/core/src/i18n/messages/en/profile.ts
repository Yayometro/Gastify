import type profile from "../es/profile";

// English for the "profile" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof profile, string> = {
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
