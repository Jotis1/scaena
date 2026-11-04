import { toNextJsHandler } from "better-auth/next-js";
import { auth, handleAuth } from "@/lib/auth";

// better-auth atiende aquí el inicio de sesión, el callback de Twitch, la sesión y la salida.
export const { GET, POST } = toNextJsHandler((request: Request) => handleAuth(auth(), request));
