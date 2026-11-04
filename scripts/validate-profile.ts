// Valida content/channel.yaml antes del build: si algo no vale, la construcción falla con el campo en el
// mensaje (specs/channel-profile, «Validación del perfil al construir»).
// Uso: bun run validate-profile [ruta]
import { readFileSync } from "node:fs";
import { PROFILE_PATH, parseProfile } from "../lib/profile";

const path = process.argv[2] ?? PROFILE_PATH;

try {
	const profile = parseProfile(readFileSync(path, "utf8"));
	console.log(`Perfil válido: ${profile.name} (twitch.tv/${profile.twitch.login}).`);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
