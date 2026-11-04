// Lo que Scaena necesita de Redis, y nada más. Dos implementaciones: Upstash en producción y memoria en los
// tests (o en local sin Redis). Las claves salen siempre de `lib/redis/keys.ts`.

export interface StreamEntry {
	/** Id de Redis: `<milisegundos>-<secuencia>`. Es lo que viaja como `id:` en el SSE. */
	id: string;
	fields: Record<string, string>;
}

export interface Store {
	get<T = unknown>(key: string): Promise<T | null>;
	/** `true` si lo guardó (con `nx`, `false` si ya existía). */
	set(key: string, value: unknown, options?: { ex?: number; nx?: boolean }): Promise<boolean>;
	del(key: string): Promise<void>;
	hset(key: string, fields: Record<string, string>): Promise<void>;
	hgetall(key: string): Promise<Record<string, string>>;
	/** Añade al stream y recorta lo anterior a `minId` (aproximado, como `MINID ~`). */
	xadd(key: string, fields: Record<string, string>, minId?: string): Promise<string>;
	/** Entradas con id estrictamente mayor que `after` (o desde el principio), en orden. */
	xrange(key: string, after?: string, count?: number): Promise<StreamEntry[]>;
}
