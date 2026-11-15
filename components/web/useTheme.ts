"use client";

import { Monitor01, Moon01, Sun } from "@untitledui/icons";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_OPTIONS = [
	{ value: "light", label: "Claro", icon: Sun },
	{ value: "dark", label: "Oscuro", icon: Moon01 },
	{ value: "system", label: "Sistema", icon: Monitor01 },
] as const;

function storedTheme(): Theme {
	try {
		const value = localStorage.getItem("theme");
		return value === "light" || value === "dark" ? value : "system";
	} catch {
		return "system";
	}
}

/**
 * Tema de la web (specs/channel-site, «Claro y oscuro»): lo comparten el selector suelto (`ThemeMenu`) y el menú de la
 * cuenta (`AccountMenu`). La clase la pone antes `public/theme-init.js`, que también sigue al sistema cuando no hay
 * elección guardada. Las copias del selector (fila móvil y escritorio) se enteran por el evento `scaena:theme`.
 */
export function useTheme(): [Theme, (value: string) => void] {
	// Hasta hidratar se pinta «Sistema», que es lo que tiene quien entra por primera vez.
	const [theme, setTheme] = useState<Theme>("system");

	useEffect(() => {
		setTheme(storedTheme());
		const sync = () => setTheme(storedTheme());
		window.addEventListener("scaena:theme", sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener("scaena:theme", sync);
			window.removeEventListener("storage", sync);
		};
	}, []);

	const choose = (value: string) => {
		const next: Theme = value === "light" || value === "dark" ? value : "system";
		try {
			if (next === "system") localStorage.removeItem("theme");
			else localStorage.setItem("theme", next);
		} catch {}
		const dark =
			next === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : next === "dark";
		document.documentElement.classList.toggle("dark-mode", dark);
		setTheme(next);
		window.dispatchEvent(new Event("scaena:theme"));
	};

	return [theme, choose];
}
