import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = {
	title: "Scaena",
	description: "Juegos a mi ritmo, sin prisa.",
	icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
};

export default function WebLayout({ children }: { children: ReactNode }) {
	return (
		// `theme-init.js` pone `dark-mode` antes de que React hidrate: la clase no coincide con el servidor.
		<html lang="es" suppressHydrationWarning>
			<head>
				{/* Bloqueante a propósito: tiene que poner el tema antes del primer fotograma. */}
				<script src="/theme-init.js" />
			</head>
			<body className="bg-primary font-body text-primary antialiased">{children}</body>
		</html>
	);
}
