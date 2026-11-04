// Tiempo en emisión a partir del inicio (design.md, decisión 6: se calcula en el cliente). `2:14:05`, o `14:05`
// en la primera hora, como el reloj de Regula.
export function uptime(startedAt: string, now: number = Date.now()): string {
	const total = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const pad = (n: number) => String(n).padStart(2, "0");
	return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
