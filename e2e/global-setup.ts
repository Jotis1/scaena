import pg from "pg";
import { E2E_DATABASE_URL } from "./session";

// Antes de los tests: que el Postgres de los tests responda y no queden usuarios de una pasada cortada a medias.
// En CI es el servicio del workflow; en local, el de E2E_DATABASE_URL o, si no, el `prisma dev` del README.
export default async function globalSetup() {
	const c = new pg.Client({ connectionString: E2E_DATABASE_URL, connectionTimeoutMillis: 5000 });
	try {
		await c.connect();
		await c.query(`delete from "user" where id like 'e2e-%'`);
	} catch (e) {
		throw new Error(
			`El Postgres de los tests no responde (${E2E_DATABASE_URL}): ${e instanceof Error ? e.message : e}. ` +
				"Arráncalo y aplica las migraciones como dice el README («Los tests de navegador usan su propio Postgres»).",
		);
	} finally {
		await c.end().catch(() => {});
	}
}
