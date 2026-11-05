// Configuración de Prisma 7. Las migraciones van en prisma/migrations; la URL sale de DATABASE_URL
// (en local, la de `bunx prisma dev --name scaena`; en Vercel, la de Neon, con la conexión directa si la hay).
import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Host sin el `-pooler` de Neon: la conexión directa y la del pooler son la misma base. */
function baseHost(url: string | undefined): string | null {
	try {
		return url ? new URL(url).host.replace("-pooler.", ".") : null;
	} catch {
		return null;
	}
}

/**
 * En Neon, las migraciones van por la conexión directa (`DATABASE_URL_UNPOOLED`, la crea la integración de Vercel
 * con el prefijo `DATABASE`): por el pooler pueden fallar. Solo si es la misma base que `DATABASE_URL`: si alguien
 * apunta `DATABASE_URL` a otra (los tests, una base local), una `DATABASE_URL_UNPOOLED` que siga en `.env` no puede
 * llevarse las migraciones a producción.
 */
function migrationsUrl(): string | undefined {
	const url = process.env.DATABASE_URL;
	const direct = process.env.DATABASE_URL_UNPOOLED;
	return direct && baseHost(direct) === baseHost(url) ? direct : url;
}

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: migrationsUrl(),
		// `prisma dev` trae su propia base auxiliar para `migrate dev`; sin ella, Prisma la crearía copiando
		// `template1`, que ahí es la base de trabajo y ya tiene tablas. En Vercel no hace falta.
		shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
	},
});
