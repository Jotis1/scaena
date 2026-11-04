import { describe, expect, it } from "vitest";
import { readEnv } from "./env";

const VALID_ENV = {
	TWITCH_CLIENT_ID: "abc",
	TWITCH_CLIENT_SECRET: "def",
	TWITCH_EVENTSUB_SECRET: "un-secreto-largo",
	YOUTUBE_API_KEY: "yt",
	KV_REST_API_URL: "https://ejemplo.upstash.io",
	KV_REST_API_TOKEN: "tok",
	BETTER_AUTH_SECRET: "x".repeat(32),
	BETTER_AUTH_URL: "http://localhost:3000",
	DATABASE_URL: "postgresql://u:p@localhost/scaena",
	STUDIO_ALLOWED_TWITCH_IDS: "12345, 678",
};

describe("readEnv", () => {
	it("acepta un entorno completo y separa los ids permitidos", () => {
		expect(readEnv(VALID_ENV).STUDIO_ALLOWED_TWITCH_IDS).toEqual(["12345", "678"]);
	});

	it("nombra cada variable que falta", () => {
		const { YOUTUBE_API_KEY: _, DATABASE_URL: __, ...incomplete } = VALID_ENV;
		expect(() => readEnv(incomplete)).toThrow(/YOUTUBE_API_KEY: falta[\s\S]*DATABASE_URL: falta/);
	});

	it("explica por qué no vale una variable, sin enseñar su valor", () => {
		const source = { ...VALID_ENV, TWITCH_EVENTSUB_SECRET: "corto" };
		expect(() => readEnv(source)).toThrow("TWITCH_EVENTSUB_SECRET: entre 10 y 100 caracteres ASCII");
		expect(() => readEnv(source)).not.toThrow(/corto/);
	});

	it("rechaza ids de Twitch que no son cifras", () => {
		expect(() => readEnv({ ...VALID_ENV, STUDIO_ALLOWED_TWITCH_IDS: "jotis1" })).toThrow(
			/STUDIO_ALLOWED_TWITCH_IDS/,
		);
	});

	it("rechaza una base de datos que no es Postgres", () => {
		expect(() => readEnv({ ...VALID_ENV, DATABASE_URL: "mysql://x" })).toThrow(/DATABASE_URL/);
	});
});
