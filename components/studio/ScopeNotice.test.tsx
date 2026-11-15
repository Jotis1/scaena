import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ScopeNotice } from "./ScopeNotice";

vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { social: async () => {} } } }));

// specs/twitch-events, «Conexión del canal», «Falta el permiso de metas».
describe("aviso de permisos", () => {
	it("dice qué permiso falta, como está, sin contar novedades", () => {
		const html = renderToStaticMarkup(<ScopeNotice missing={["channel:read:goals"]} />);
		expect(html).toContain("Falta un permiso de Twitch");
		expect(html).toContain(
			"Para ver tus metas de Twitch y cómo van hace falta un permiso que tu sesión no tiene.",
		);
		expect(html).toContain("Volver a entrar con Twitch");
		expect(html).not.toMatch(/ahora|nuevo/i);
	});

	it("sin permisos que falten, nada", () => {
		expect(renderToStaticMarkup(<ScopeNotice missing={[]} />)).toBe("");
	});
});
