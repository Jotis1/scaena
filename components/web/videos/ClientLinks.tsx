"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/**
 * Los enlaces internos de dentro (los `LinkCard` de Regula, que son `<a>` normales) navegan en el cliente, como
 * `next/link`: sin recargar la página. Así, en `/videos`, el clic en una tarjeta cuenta y el vídeo empieza a
 * reproducirse (design.md de create-scaena, decisión 7). Con Ctrl, Mayús, Cmd o el botón central, el navegador hace
 * lo suyo.
 */
export function ClientLinks({ children }: { children: ReactNode }) {
	const router = useRouter();
	const onClick = (e: MouseEvent<HTMLDivElement>) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const a = (e.target as HTMLElement).closest("a");
		const href = a?.getAttribute("href");
		if (!a || !href?.startsWith("/") || a.target) return;
		e.preventDefault();
		router.push(href);
	};
	// biome-ignore lint/a11y/noStaticElementInteractions: solo delega el clic de los enlaces de dentro, que ya son enlaces.
	// biome-ignore lint/a11y/useKeyWithClickEvents: Intro sobre un enlace también lanza `click`.
	return <div onClick={onClick}>{children}</div>;
}
