// Secciones del estudio, en el orden de la barra lateral
// (specs/channel-site, «Navegación del estudio»).
export const STUDIO_PAGES = [
	{ id: "overlays", href: "/studio/overlays", label: "Overlays" },
	{ id: "guide", href: "/studio/guide", label: "Guía de uso" },
	{ id: "assets", href: "/studio/assets", label: "Recursos" },
	{ id: "connection", href: "/studio/connection", label: "Conexión" },
] as const;

/** La sección de una ruta, o `undefined` fuera del estudio. */
export const studioPageOf = (path: string) =>
	STUDIO_PAGES.find((p) => path === p.href || path.startsWith(`${p.href}/`));
