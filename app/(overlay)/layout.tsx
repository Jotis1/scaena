import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import "./overlay.css";

export const metadata: Metadata = {
	title: "Scaena · Overlay",
	robots: { index: false, follow: false },
	icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
};

// Fuentes de navegador de OBS: siempre en oscuro, fondo transparente, sin cabecera ni desplazamiento.
export default function OverlayLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="es" className="dark-mode">
			<body className="font-body text-primary antialiased">{children}</body>
		</html>
	);
}
