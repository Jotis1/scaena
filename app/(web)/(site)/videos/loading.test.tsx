import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import VideosLoading from "./loading";

// specs/channel-site, «Página de vídeos», escenario «Cargando».
describe("carga de /videos", () => {
	const html = renderToStaticMarkup(<VideosLoading />);

	it("marca la lista como ocupada para el lector de pantalla", () => {
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain('aria-label="Cargando vídeos"');
	});

	it("deja el hueco del reproductor, de su texto y de ocho tarjetas", () => {
		// 1 reproductor + 1 insignia + 1 bloque de texto + 8 × (miniatura + texto).
		const skeletons = html.match(/motion-safe:animate-\[pulse/g) ?? [];
		expect(skeletons.length).toBeGreaterThanOrEqual(19);
		expect(html).toContain("Vídeos");
	});
});
