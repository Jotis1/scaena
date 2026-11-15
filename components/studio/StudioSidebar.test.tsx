import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StudioSidebar } from "./StudioSidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/studio/connection" }));

// specs/channel-site, «Navegación del estudio».
describe("barra lateral del estudio", () => {
	it("las cuatro secciones, con la actual marcada y sin la cuenta", () => {
		const html = renderToStaticMarkup(<StudioSidebar />);
		for (const label of ["Overlays", "Guía de uso", "Recursos", "Conexión"])
			expect(html).toContain(label);
		expect(html).toMatch(
			/href="\/studio\/connection"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/studio\/connection"/,
		);
		expect(html).toContain('aria-label="Secciones del estudio"');
		expect(html).not.toContain("Cerrar sesión");
		// Sin título que repita el estudio o la sección.
		expect(html).not.toContain("Estudio ·");
	});
});
