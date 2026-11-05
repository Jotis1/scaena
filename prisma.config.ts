// Configuración de Prisma 7. Las migraciones van en prisma/migrations; la URL sale de DATABASE_URL
// (en local, la de `bunx prisma dev --name scaena`; en Vercel, la de Neon, con la conexión directa si la hay).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		// En Neon, las migraciones van por la conexión directa (`DATABASE_URL_UNPOOLED`, la crea la integración de
		// Vercel con el prefijo `DATABASE`): por el pooler pueden fallar. La app usa siempre `DATABASE_URL`.
		url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
		// `prisma dev` trae su propia base auxiliar para `migrate dev`; sin ella, Prisma la crearía copiando
		// `template1`, que ahí es la base de trabajo y ya tiene tablas. En Vercel no hace falta.
		shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
	},
});
