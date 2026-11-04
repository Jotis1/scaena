// Tipo y juego de un vídeo a partir del título (design.md, decisión 7; specs/youtube-vods, «Tipo y juego desde
// el título»). `^(.+) - (.+) #(\d+)$`: el primer grupo es codicioso, así que el último « - » separa el título del
// juego. Si encaja, es un directo resubido; si no, un editado con el título tal cual.

export type VideoKind = "live" | "edited";

export type ParsedTitle =
	| { kind: "live"; title: string; game: string; number: number }
	| { kind: "edited"; title: string };

const LIVE_TITLE = /^(.+) - (.+) #(\d+)$/;

export function parseTitle(raw: string): ParsedTitle {
	const title = raw.trim();
	const m = LIVE_TITLE.exec(title);
	if (!m) return { kind: "edited", title };
	const [, name = "", game = "", n = "0"] = m;
	return { kind: "live", title: name.trim(), game: game.trim(), number: Number(n) };
}

/** Lo que se lee en la tarjeta (diseño: «Directo resubido», «Editado»). */
export const KIND_LABELS: Record<VideoKind, string> = { live: "Directo resubido", edited: "Editado" };

/** Juego y número de un directo, con el guion del diseño: «Cyberpunk 2077 - #1». */
export function gameLine(p: ParsedTitle): string | null {
	return p.kind === "live" ? `${p.game} - #${p.number}` : null;
}
