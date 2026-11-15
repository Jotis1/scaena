import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/profile", () => ({ loadMainProfile: async () => ({}) }));
const { siteLinks } = await import("./SiteFooter");

// specs/channel-site, «Diseño de la suite», «Pie de la web» y «Estudio en el pie».
describe("pie de la web", () => {
	it("«Esta web» lleva Inicio, Vídeos y Estudio", () => {
		expect(siteLinks(false).map((l) => l.label)).toEqual(["Inicio", "Vídeos", "Estudio"]);
	});

	it("«Estudio» va a Overlays con sesión y a la entrada sin ella, como en la cabecera", () => {
		expect(siteLinks(true).at(-1)?.href).toBe("/studio/overlays");
		expect(siteLinks(false).at(-1)?.href).toBe("/studio/login");
	});
});
