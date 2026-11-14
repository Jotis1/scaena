// URL de cada fuente de navegador del estudio (diseño: «Overlays»; design.md, decisiones 9, 10 y 15). Solo los
// parámetros que no son el valor por defecto, para que la URL se lea. Las que reciben eventos llevan `token`; la
// las escenas montadas, además, `since` (la hora a la que se copia), por si no hay meta guardada y cuenta la URL.
import { type CanvasId, DEFAULT_CANVAS } from "../overlay/canvas";

export type SourceKind =
	| "chat"
	| "alerts"
	| "events"
	| "goal"
	| "status"
	| "camera"
	| "scene/game"
	| "scene/chatting"
	| "scene/starting"
	| "scene/brb"
	| "scene/ending"
	| "scene/offline";

export interface SourceOptions {
	translucent?: boolean;
	animate?: boolean;
	message?: boolean;
	rows?: number;
	viewers?: boolean;
	ratio?: string;
	name?: string;
	minutes?: number;
	next?: string;
	chat?: boolean;
	camera?: boolean;
	events?: boolean;
	goalPiece?: boolean;
	/** Lienzo de las escenas; en las piezas no cuenta. */
	canvas?: CanvasId;
}

/** Fuentes que reciben eventos: sin token no muestran nada de eso (specs/obs-overlays, «Acceso con token»). */
export const WITH_TOKEN: readonly SourceKind[] = ["alerts", "events", "goal", "scene/game", "scene/chatting"];

export interface UrlContext {
	origin: string;
	channel: string;
	token: string;
	/** Marca de tiempo para `since` (ms). */
	now: number;
}

export function sourceUrl(kind: SourceKind, o: SourceOptions, c: UrlContext): string {
	const q = new URLSearchParams();
	const flag = (name: string, value: boolean | undefined, byDefault: boolean) => {
		if (value !== undefined && value !== byDefault) q.set(name, value ? "1" : "0");
	};
	switch (kind) {
		case "chat":
			flag("translucent", o.translucent, false);
			flag("animate", o.animate, true);
			break;
		case "alerts":
			flag("message", o.message, true);
			break;
		case "events":
			if (o.rows !== undefined) q.set("rows", String(o.rows));
			break;
		// La meta se guarda en Scaena y llega por el flujo: la URL solo lleva el token (specs/obs-overlays, «Meta
		// editable en el estudio»). Las URL antiguas con `type`, `start` y `goal` siguen valiendo sin meta guardada.
		case "goal":
			break;
		case "status":
			flag("viewers", o.viewers, false);
			break;
		case "camera":
			if (o.ratio && o.ratio !== "16:9") q.set("ratio", o.ratio);
			if (o.name) q.set("name", o.name);
			break;
		case "scene/game":
			flag("translucent", o.translucent, true);
			flag("camera", o.camera, true);
			flag("events", o.events, true);
			if (o.goalPiece === false) q.set("goal", "0");
			else q.set("since", String(c.now));
			break;
		case "scene/chatting":
			flag("events", o.events, true);
			if (o.goalPiece === false) q.set("goal", "0");
			else q.set("since", String(c.now));
			break;
		case "scene/starting":
		case "scene/brb":
			if (o.minutes) q.set("minutes", String(o.minutes));
			break;
		case "scene/ending":
		case "scene/offline":
			if (o.next) q.set("next", o.next);
			break;
	}
	// Solo las escenas cambian de lienzo, y solo se escribe si no es el de por defecto (design.md de
	// refine-site-and-ultrawide-scenes, decisión 7).
	if (kind.startsWith("scene/") && o.canvas && o.canvas !== DEFAULT_CANVAS) q.set("canvas", o.canvas);
	if (WITH_TOKEN.includes(kind)) q.set("token", c.token);
	const s = q.toString();
	return `${c.origin}/overlay/${c.channel}/${kind}${s ? `?${s}` : ""}`;
}

/** La misma URL con el token tapado salvo los cuatro últimos, para enseñarla en pantalla sin filtrarlo. */
export function maskToken(url: string, token: string): string {
	return token ? url.replace(token, `••••${token.slice(-4)}`) : url;
}
