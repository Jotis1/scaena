import type { NextConfig } from "next";

const config: NextConfig = {
	// Biome hace el lint; `next build` no lo repite.
	poweredByHeader: false,
	// El perfil del canal se lee del disco en el servidor: hay que incluirlo en el despliegue.
	// Miniaturas de YouTube por el optimizador de Next: el navegador no habla con YouTube hasta reproducir.
	images: { remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }] },
	outputFileTracingIncludes: { "/**": ["./content/**"] },
	async headers() {
		// OBS cachea las fuentes de navegador: sin esto, puede quedarse con una versión vieja del overlay.
		return [{ source: "/overlay/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] }];
	},
};

export default config;
