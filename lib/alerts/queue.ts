// Cola de alertas (design.md, decisión 5; specs/twitch-events, «Cola de alertas»): de una en una y en orden
// de llegada. Cada alerta entra (`enter`), se queda `duration` ms, sale (`exit`, 200 ms) y entra la siguiente.

export const EXIT_MS = 200;
export const DEFAULT_DURATION_MS = 7000;

export interface Showing<T> {
	item: T;
	state: "enter" | "exit";
}

export class AlertQueue<T> {
	private pending: T[] = [];
	private current: Showing<T> | null = null;
	private timer: ReturnType<typeof setTimeout> | undefined;

	constructor(
		private readonly onChange: (showing: Showing<T> | null) => void,
		private readonly durationMs = DEFAULT_DURATION_MS,
	) {}

	push(item: T): void {
		this.pending.push(item);
		if (!this.current) this.next();
	}

	get size(): number {
		return this.pending.length + (this.current ? 1 : 0);
	}

	private next(): void {
		const item = this.pending.shift();
		this.current = item === undefined ? null : { item, state: "enter" };
		this.onChange(this.current);
		if (item === undefined) return;
		this.timer = setTimeout(() => {
			this.current = { item, state: "exit" };
			this.onChange(this.current);
			this.timer = setTimeout(() => this.next(), EXIT_MS);
		}, this.durationMs);
	}

	clear(): void {
		if (this.timer) clearTimeout(this.timer);
		this.pending = [];
		this.current = null;
	}
}
