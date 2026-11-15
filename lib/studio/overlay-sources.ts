// Las doce fuentes de la página de Overlays y cuál se enseña según la URL de la página (`?source=`), con el enlace
// antiguo `?tab=scenes` (specs/obs-overlays, «Página de URLs para copiar»; design.md del cambio redesign-studio,
// decisión 2). Sin React: lo usan la página, el componente y los tests.
import type { SourceKind } from "./overlay-urls";

export const PIECE_IDS = ["chat", "alerts", "events", "goal", "status", "camera"] as const;
export const SCENE_IDS = ["game", "chatting", "starting", "brb", "ending", "offline"] as const;
export type SourceId = (typeof PIECE_IDS)[number] | (typeof SCENE_IDS)[number];

export const isScene = (id: SourceId): id is (typeof SCENE_IDS)[number] =>
	(SCENE_IDS as readonly string[]).includes(id);

/** La fuente en las URL de los overlays: las escenas van bajo `scene/`. */
export const kindOf = (id: SourceId): SourceKind => (isScene(id) ? `scene/${id}` : id) as SourceKind;

/** La fuente pedida; `?tab=scenes` sin `source` abre la escena de juego, y lo demás, el chat. */
export function sourceOf(q: { source?: string; tab?: string }): SourceId {
	const all: readonly string[] = [...PIECE_IDS, ...SCENE_IDS];
	if (q.source && all.includes(q.source)) return q.source as SourceId;
	return q.tab === "scenes" ? "game" : "chat";
}

/** Sección de la guía de OBS de cada escena; las de pantalla completa van juntas. */
export const guideAnchor = (id: SourceId) => (id === "game" || id === "chatting" ? id : "fullscreen");
