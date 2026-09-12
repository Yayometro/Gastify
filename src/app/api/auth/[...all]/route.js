import { auth } from "@/lib/auth/betterAuth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
