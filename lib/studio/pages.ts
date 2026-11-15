// Secciones del estudio, en el orden de la barra lateral (specs/channel-site, «Navegación del estudio»). «Cuentas»
// solo la ven los administradores (specs/studio-accounts, «Administradores»).
export const STUDIO_PAGES = [
	{ id: "overlays", href: "/studio/overlays", label: "Overlays", adminOnly: false },
	{ id: "guide", href: "/studio/guide", label: "Guía de uso", adminOnly: false },
	{ id: "assets", href: "/studio/assets", label: "Recursos", adminOnly: false },
	{ id: "connection", href: "/studio/connection", label: "Conexión", adminOnly: false },
	{ id: "accounts", href: "/studio/accounts", label: "Cuentas", adminOnly: true },
] as const;

/** Las secciones que ve una cuenta: todas un administrador; las demás, sin «Cuentas». */
export const studioPagesFor = (admin: boolean) => STUDIO_PAGES.filter((p) => admin || !p.adminOnly);

/** La sección de una ruta, o `undefined` fuera del estudio. */
export const studioPageOf = (path: string) =>
	STUDIO_PAGES.find((p) => path === p.href || path.startsWith(`${p.href}/`));
