// Si faltan variables de entorno, el proceso termina con el error: mejor no arrancar que servir un 500
// en cada petición.
import { readEnv } from "./lib/env";

try {
	readEnv();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
