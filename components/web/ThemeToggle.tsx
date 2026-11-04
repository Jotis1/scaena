"use client";

import { Button } from "@jotis-me/react";
import { useEffect, useState } from "react";

// Botón único de tema (decidido): luna en claro, sol en oscuro. La clase la pone antes `public/theme-init.js`;
// aquí solo se cambia y se guarda la elección (specs/channel-site, «Claro y oscuro»).
export function ThemeToggle() {
	const [dark, setDark] = useState<boolean | null>(null);

	useEffect(() => {
		const html = document.documentElement;
		setDark(html.classList.contains("dark-mode"));
		// Si el sistema cambia y no hay elección guardada, theme-init.js cambia la clase: se sigue aquí.
		const observer = new MutationObserver(() => setDark(html.classList.contains("dark-mode")));
		observer.observe(html, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	const toggle = () => {
		const next = !document.documentElement.classList.contains("dark-mode");
		document.documentElement.classList.toggle("dark-mode", next);
		try {
			localStorage.setItem("theme", next ? "dark" : "light");
		} catch {}
	};

	// Hasta hidratar no se sabe el tema: se pinta la luna, que es lo que ve quien entra en claro.
	return (
		<Button
			hierarchy="tertiary"
			size="md"
			iconOnly={dark ? "sun" : "moon-01"}
			label={dark ? "Cambiar a claro" : "Cambiar a oscuro"}
			onClick={toggle}
		/>
	);
}
