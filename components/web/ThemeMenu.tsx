"use client";

import { Button, Dropdown } from "@jotis-me/react";
import { Monitor01, Moon01, Sun } from "@untitledui/icons";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const OPTIONS = [
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

// Selector de tema en desplegable: «Claro», «Oscuro» y «Sistema» (specs/channel-site, «Claro y oscuro»; design.md,
// decisión 2). El disparador es solo icono, así mide lo mismo con cualquier opción y la cabecera no se mueve. La clase
// la pone antes `public/theme-init.js`, que también sigue al sistema cuando no hay elección guardada. Sin `id` fijos:
// con `mobileActions`, la cabecera lo pinta dos veces.
export function ThemeMenu() {
	// Hasta hidratar se pinta «Sistema», que es lo que tiene quien entra por primera vez.
	const [theme, setTheme] = useState<Theme>("system");

	useEffect(() => setTheme(storedTheme()), []);

	const choose = (value: string) => {
		const next = value as Theme;
		const html = document.documentElement;
		try {
			if (next === "system") localStorage.removeItem("theme");
			else localStorage.setItem("theme", next);
		} catch {}
		const dark =
			next === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : next === "dark";
		html.classList.toggle("dark-mode", dark);
		setTheme(next);
		// La otra copia del selector (fila móvil o escritorio) se entera por este evento.
		window.dispatchEvent(new Event("scaena:theme"));
	};

	useEffect(() => {
		const sync = () => setTheme(storedTheme());
		window.addEventListener("scaena:theme", sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener("scaena:theme", sync);
			window.removeEventListener("storage", sync);
		};
	}, []);

	const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];

	return (
		<Dropdown
			aria-label="Tema"
			trigger={
				<Button
					hierarchy="tertiary"
					size="sm"
					iconOnly={current.icon}
					label={`Tema: ${current.label}`}
				/>
			}
			items={OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }))}
			selectedValue={theme}
			onSelectionChange={choose}
		/>
	);
}
