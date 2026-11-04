// Parámetros de URL de los overlays (specs/obs-overlays, «Configuración por parámetros de la URL»).
// Un valor que falta o no vale cae al valor por defecto: una URL mal pegada en OBS no deja la fuente en
// blanco. Los nombres van en inglés (design.md, decisión 10).

/** Lo que llega de Next (`searchParams`) o de un `URLSearchParams`. */
export type SearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

function raw(q: SearchParams, name: string): string | undefined {
	const v = q instanceof URLSearchParams ? (q.get(name) ?? undefined) : q[name];
	const first = Array.isArray(v) ? v[0] : v;
	return first === undefined ? undefined : first.trim();
}

/** Entero dentro de un rango; si no es un entero o se sale, el valor por defecto. */
export function int(
	q: SearchParams,
	name: string,
	fallback: number,
	{ min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {},
): number {
	const v = raw(q, name);
	if (v === undefined || !/^-?\d+$/.test(v)) return fallback;
	const n = Number(v);
	return n >= min && n <= max ? n : fallback;
}

/** Igual que `int`, pero `undefined` si no viene o no vale (para opciones sin valor por defecto). */
export function optionalInt(
	q: SearchParams,
	name: string,
	range: { min?: number; max?: number } = {},
): number | undefined {
	const n = int(q, name, Number.NaN, range);
	return Number.isNaN(n) ? undefined : n;
}

const YES = new Set(["1", "true", "yes", "on", "si", "sí"]);
const NO = new Set(["0", "false", "no", "off"]);

/** `1`/`true`/`on` y `0`/`false`/`off`; cualquier otra cosa, el valor por defecto. */
export function bool(q: SearchParams, name: string, fallback: boolean): boolean {
	const v = raw(q, name)?.toLowerCase();
	if (v === undefined) return fallback;
	if (YES.has(v)) return true;
	if (NO.has(v)) return false;
	return fallback;
}

/** Fecha ISO 8601 o milisegundos desde 1970; `undefined` si no se entiende. */
export function date(q: SearchParams, name: string): Date | undefined {
	const v = raw(q, name);
	if (!v) return undefined;
	const d = /^\d+$/.test(v) ? new Date(Number(v)) : /^\d{4}-\d{2}-\d{2}/.test(v) ? new Date(v) : undefined;
	return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

/** Uno de una lista cerrada; si no está en la lista, el valor por defecto. */
export function oneOf<const T extends string>(
	q: SearchParams,
	name: string,
	options: readonly T[],
	fallback: T,
): T {
	const v = raw(q, name);
	return v !== undefined && (options as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** Texto corto visible: recortado, sin saltos de línea y con un máximo; vacío o ausente, el valor por defecto. */
export function text(q: SearchParams, name: string, fallback: string, max = 80): string {
	const v = raw(q, name)?.replace(/\s+/g, " ");
	return v ? v.slice(0, max) : fallback;
}
