// 2FA backup codes are only ever returned once, at generation time -
// Better Auth stores them encrypted and never re-exposes the plaintext, by
// design. "Copiar" alone loses them the moment the clipboard is overwritten
// by anything else; a real file the user can drop into a password manager,
// notes app, or cloud drive (the way Uber and other apps handle this) is
// the actual safety net.
export default function downloadBackupCodes(codes, filename = "gastify-backup-codes.txt") {
  const content = [
    "Gastify - códigos de respaldo de verificación en dos pasos",
    "Cada código solo funciona una vez. Guárdalos en un lugar seguro.",
    "",
    ...codes,
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
