// Almacén sobre Upstash Redis (REST). Solo los comandos que usa Scaena.
import type { Redis } from "@upstash/redis";
import { redis } from "../redis/client";
import type { Store } from "./types";

export function redisStore(r: Redis): Store {
	return {
		async get<T>(key: string) {
			return (await r.get<T>(key)) ?? null;
		},
		async set(key, value, options = {}) {
			const base = options.nx ? { nx: true as const } : {};
			const res = options.ex
				? await r.set(key, value, { ...base, ex: options.ex })
				: await r.set(key, value, base);
			return res === "OK";
		},
		async del(key) {
			await r.del(key);
		},
		async hset(key, fields) {
			await r.hset(key, fields);
		},
		async hgetall(key) {
			return (await r.hgetall<Record<string, string>>(key)) ?? {};
		},
		async xadd(key, fields, minId) {
			return minId
				? r.xadd(key, "*", fields, { trim: { type: "MINID", threshold: minId, comparison: "~" } })
				: r.xadd(key, "*", fields);
		},
		async xrange(key, after, count) {
			// `(id` es exclusivo desde Redis 6.2: solo lo que vino después.
			const start = after ? `(${after}` : "-";
			const res = (await r.xrange(key, start, "+", count)) as Record<string, Record<string, unknown>>;
			return Object.entries(res ?? {}).map(([id, fields]) => ({
				id,
				// Upstash deserializa el JSON por su cuenta: se vuelve a texto para que no dependa de eso.
				fields: Object.fromEntries(
					Object.entries(fields).map(([k, v]) => [
						k,
						typeof v === "string" ? v : JSON.stringify(v),
					]),
				),
			}));
		},
	};
}

let current: Store | undefined;

/** Almacén del proceso: Upstash, salvo que un test ponga otro con `setStore`. */
export function store(): Store {
	current ??= redisStore(redis());
	return current;
}

export function setStore(s: Store | undefined): void {
	current = s;
}
