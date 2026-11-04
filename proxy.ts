// Protección del estudio (design.md, decisión 9). Aquí solo se mira si hay cookie de sesión, que es rápido;
// cada página y cada ruta de `/api/studio` comprueba la sesión de verdad (`lib/estudio/sesion.ts`).
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (pathname === "/studio/login") return NextResponse.next();
	if (getSessionCookie(request)) return NextResponse.next();
	if (pathname.startsWith("/api/studio"))
		return NextResponse.json({ error: "Hace falta entrar en el estudio." }, { status: 401 });
	return NextResponse.redirect(new URL("/studio/login", request.url));
}

export const config = { matcher: ["/studio/:path*", "/api/studio/:path*"] };
