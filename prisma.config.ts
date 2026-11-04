// Configuración de Prisma 7. Las migraciones van en prisma/migrations; la URL sale de DATABASE_URL
// (en local, la de `bunx prisma dev --name scaena`; en Vercel, la de Neon).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DATABASE_URL,
		// `prisma dev` trae su propia base auxiliar para `migrate dev`; sin ella, Prisma la crearía copiando
		// `template1`, que ahí es la base de trabajo y ya tiene tablas. En Vercel no hace falta.
		shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
	},
});
