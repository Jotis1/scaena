// Variables de entorno del servidor, validadas con Zod. `instrumentation.ts` las comprueba al arrancar,
// así que en producción el servidor no llega a servir nada si falta alguna. No se validan al construir:
// el CI compila sin secretos.
import { z } from "zod";

const twitchIds = z
	.string()
	.trim()
	.min(1, "pon al menos un id de Twitch")
	.transform((s) => s.split(",").map((id) => id.trim()))
	.pipe(z.array(z.string().regex(/^\d+$/, "los ids de Twitch son solo cifras")).min(1));

export const envSchema = z.object({
	TWITCH_CLIENT_ID: z.string().min(1),
	TWITCH_CLIENT_SECRET: z.string().min(1),
	// Twitch pide entre 10 y 100 caracteres ASCII para el secreto de EventSub.
	TWITCH_EVENTSUB_SECRET: z.string().regex(/^[\x21-\x7e]{10,100}$/, "entre 10 y 100 caracteres ASCII"),
	YOUTUBE_API_KEY: z.string().min(1),
	KV_REST_API_URL: z.url(),
	KV_REST_API_TOKEN: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(32, "al menos 32 caracteres"),
	BETTER_AUTH_URL: z.url(),
	DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "tiene que ser una URL de Postgres"),
	STUDIO_ALLOWED_TWITCH_IDS: twitchIds,
});

export type Env = z.infer<typeof envSchema>;

/** Mensaje que nombra cada variable que falta o no vale, sin enseñar su valor. */
export function readEnv(source: Record<string, string | undefined> = process.env): Env {
	const r = envSchema.safeParse(source);
	if (r.success) return r.data;
	const problems = r.error.issues.map((i) => {
		const name = String(i.path[0] ?? "?");
		return source[name] === undefined || source[name] === "" ? `${name}: falta` : `${name}: ${i.message}`;
	});
	throw new Error(`Variables de entorno que faltan o no valen:\n- ${problems.join("\n- ")}`);
}

let cache: Env | undefined;

/** Variables ya validadas; la primera llamada valida y las siguientes reutilizan el resultado. */
export function env(): Env {
	cache ??= readEnv();
	return cache;
}
