import { defineConfig, devices } from "@playwright/test";

import { FAKE_CHAT_PORT, FAKE_REDIS_PORT } from "./e2e/ports";
import { E2E_AUTH_SECRET, E2E_DATABASE_URL } from "./e2e/session";

const PORT = 3100;

// El servidor valida las variables al arrancar (instrumentation.ts). En los tests van valores falsos:
// lo que hable con Twitch, YouTube, Redis o la base de datos se simula en cada prueba.
const ENV_E2E = {
	TWITCH_CLIENT_ID: "e2e",
	TWITCH_CLIENT_SECRET: "e2e",
	TWITCH_EVENTSUB_SECRET: "secreto-de-pruebas-e2e",
	YOUTUBE_API_KEY: "e2e",
	KV_REST_API_URL: `http://localhost:${FAKE_REDIS_PORT}`,
	KV_REST_API_TOKEN: "e2e",
	BETTER_AUTH_SECRET: E2E_AUTH_SECRET,
	BETTER_AUTH_URL: `http://localhost:${PORT}`,
	// El estudio necesita sesiones de verdad: Postgres con las migraciones aplicadas. En local, el de `prisma dev`;
	// en CI, el servicio del workflow (E2E_DATABASE_URL). Los tests crean y borran sus propios usuarios.
	DATABASE_URL: E2E_DATABASE_URL,
	STUDIO_ALLOWED_TWITCH_IDS: "1",
	// Se fija al construir: el overlay de chat habla con el servidor falso de e2e/chat.spec.ts.
	NEXT_PUBLIC_TWITCH_IRC_URL: `ws://127.0.0.1:${FAKE_CHAT_PORT}`,
};

export default defineConfig({
	testDir: "e2e",
	globalSetup: "./e2e/global-setup.ts",
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		// Upstash falso: el servidor guarda y lee de aquí, y los tests siembran datos (e2e/redis.ts).
		{
			command: "bun run e2e/fake-redis.ts",
			url: `http://localhost:${FAKE_REDIS_PORT}`,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: `bun run build && bun run start -p ${PORT}`,
			url: `http://localhost:${PORT}`,
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
			env: ENV_E2E,
		},
	],
});
