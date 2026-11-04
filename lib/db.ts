// Cliente de Prisma 7 (sin motor en Rust). En Vercel, con Neon, va por su adaptador serverless;
// en local, con el Postgres de `prisma dev` o uno normal, por `pg`. Una sola instancia por proceso.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";
import { PrismaClient } from "./generated/prisma/client";

/** Neon solo habla con su propio proxy: para cualquier otro Postgres hace falta `pg`. */
export function isNeon(url: string): boolean {
	return /\.neon\.tech(?::\d+)?\//.test(url);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function db(): PrismaClient {
	if (!globalForPrisma.prisma) {
		const url = env().DATABASE_URL;
		const adapter = isNeon(url)
			? new PrismaNeon({ connectionString: url })
			: new PrismaPg({ connectionString: url });
		globalForPrisma.prisma = new PrismaClient({ adapter });
	}
	return globalForPrisma.prisma;
}
