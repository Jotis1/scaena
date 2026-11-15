import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./SiteHeader";

let path = "/";
vi.mock("next/navigation", () => ({
	usePathname: () => path,
	useRouter: () => ({ replace: () => {}, refresh: () => {}, push: () => {} }),
}));

const estudio = (html: string) => /<a[^>]*href="([^"]+)"[^>]*>(?:(?!<\/a>).)*Estudio/s.exec(html)?.[1];

// specs/channel-site, «Entrada al estudio desde la web» y «Menú de la cuenta».
describe("cabecera de la web", () => {
	it("sin sesión: «Estudio» lleva a la entrada, con el selector de tema y sin avatar", () => {
		path = "/";
		const html = renderToStaticMarkup(<SiteHeader />);
		expect(estudio(html)).toBe("/studio/login");
		expect(html).toContain("Tema: Sistema");
		expect(html).not.toContain("Cuenta de");
	});

	it("con sesión: «Estudio» lleva a Overlays, con el avatar y sin selector de tema suelto", () => {
		path = "/videos";
		const html = renderToStaticMarkup(<SiteHeader account={{ name: "jotis_1" }} />);
		expect(estudio(html)).toBe("/studio/overlays");
		expect(html).toContain('aria-label="Cuenta de jotis_1"');
		expect(html).not.toContain("Tema: ");
	});

	it("en el estudio, «Estudio» es la página actual y no lleva secciones dentro", () => {
		path = "/studio/guide";
		const html = renderToStaticMarkup(<SiteHeader account={{ name: "jotis_1" }} />);
		expect(html).toMatch(/aria-current="page"[^>]*>(?:(?!<\/a>).)*Estudio/s);
		expect(html).not.toContain("Guía de uso");
	});
});
