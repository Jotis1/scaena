// Punto de entrada para la CLI de better-auth, que necesita una instancia ya creada:
// bunx @better-auth/cli generate --config scripts/better-auth.config.ts --output prisma/schema.prisma
import { auth as createInstance } from "../lib/auth";

export const auth = createInstance();
