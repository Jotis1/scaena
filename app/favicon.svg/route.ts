import { appIconSvg } from "@jotis-me/icons/app-icon";

// Favicon con la variante sólida del icono «Sc» en lime (diseño: «Icono de Scaena»: por debajo de 20 px, la
// sólida). Los colores salen del paquete de iconos de Regula, no de aquí.
export const dynamic = "force-static";

export function GET() {
	return new Response(appIconSvg({ letters: "Sc", hue: "lime", variant: "solid", label: "Scaena" }, 32), {
		headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" },
	});
}
