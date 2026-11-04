// Almacén en memoria con el mismo comportamiento que lo que usamos de Redis. Para tests y desarrollo local.
import type { Store, StreamEntry } from "./types";

/** `1700000000000-3` → [1700000000000, 3]. */
function idParts(id: string): [number, number] {
	const [ms = "0", seq = "0"] = id.split("-");
	return [Number(ms), Number(seq)];
}

export function compareStreamIds(a: string, b: string): number {
	const [am, as] = idParts(a);
	const [bm, bs] = idParts(b);
	return am - bm || as - bs;
}

export function memoryStore(clock: () => number = Date.now): Store & { clear(): void } {
	const values = new Map<string, { value: unknown; expiresAt?: number }>();
	const hashes = new Map<string, Record<string, string>>();
	const streams = new Map<string, StreamEntry[]>();

	const alive = (key: string) => {
		const v = values.get(key);
		if (v?.expiresAt !== undefined && v.expiresAt <= clock()) values.delete(key);
		return values.get(key);
	};

	return {
		async get<T>(key: string) {
			return (alive(key)?.value as T | undefined) ?? null;
		},
		async set(key, value, options = {}) {
			if (options.nx && alive(key)) return false;
			// Como en Upstash: lo que se guarda se lee igual (JSON de ida y vuelta).
			values.set(key, {
				value: JSON.parse(JSON.stringify(value)),
				expiresAt: options.ex ? clock() + options.ex * 1000 : undefined,
			});
			return true;
		},
		async del(key) {
			values.delete(key);
			hashes.delete(key);
			streams.delete(key);
		},
		async hset(key, fields) {
			hashes.set(key, { ...(hashes.get(key) ?? {}), ...fields });
		},
		async hgetall(key) {
			return { ...(hashes.get(key) ?? {}) };
		},
		async xadd(key, fields, minId) {
			const list = streams.get(key) ?? [];
			const ms = clock();
			const last = list.at(-1);
			const [lm, ls] = last ? idParts(last.id) : [-1, -1];
			const id = ms > lm ? `${ms}-0` : `${lm}-${ls + 1}`;
			list.push({ id, fields: { ...fields } });
			streams.set(key, minId ? list.filter((e) => compareStreamIds(e.id, minId) >= 0) : list);
			return id;
		},
		async xrange(key, after, count) {
			const list = (streams.get(key) ?? []).filter((e) => !after || compareStreamIds(e.id, after) > 0);
			return (count ? list.slice(0, count) : list).map((e) => ({ id: e.id, fields: { ...e.fields } }));
		},
		clear() {
			values.clear();
			hashes.clear();
			streams.clear();
		},
	};
}
