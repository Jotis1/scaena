import { ImageResponse } from "next/og";
import { CAMERA_RADIUS_RATIO } from "@/components/overlay/scenes/boxes";

// Máscara de la cámara para el filtro «Máscara de imagen/mezcla» de OBS (specs/obs-overlays, «Máscara de la
// cámara»; design.md, decisión 2). OBS la estira al tamaño nativo de la cámara: un PNG 16:9 con el radio en
// proporción al ancho vale para cualquier cámara 16:9 y para los dos lienzos.
export const dynamic = "force-static";

const WIDTH = 1920;
const HEIGHT = 1080;

export function GET() {
	return new ImageResponse(
		<div
			style={{
				width: WIDTH,
				height: HEIGHT,
				display: "flex",
				// color-fijo: es una máscara de OBS, no interfaz; solo cuenta que sea opaca.
				backgroundColor: "#fff",
				borderRadius: WIDTH * CAMERA_RADIUS_RATIO,
			}}
		/>,
		{
			width: WIDTH,
			height: HEIGHT,
			headers: { "Content-Disposition": 'attachment; filename="scaena-mascara-camara.png"' },
		},
	);
}
