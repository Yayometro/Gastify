// Prints the current 6-digit TOTP code of the shared QA account (SHARED_QA_TOTP_SECRET in .env.test-account.local).
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.test-account.local", import.meta.url), "utf8");
const secret = env.match(/^SHARED_QA_TOTP_SECRET=(\S+)/m)?.[1];
if (!secret) throw new Error("SHARED_QA_TOTP_SECRET missing in .env.test-account.local");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
let bits = "";
for (const ch of secret.replace(/=+$/, "").toUpperCase()) bits += ALPHABET.indexOf(ch).toString(2).padStart(5, "0");
const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));

const counter = Buffer.alloc(8);
counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
const hmac = createHmac("sha1", key).update(counter).digest();
const offset = hmac[19] & 0xf;
const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
console.log(code);
