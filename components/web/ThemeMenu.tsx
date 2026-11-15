"use client";

import { Button, Dropdown } from "@jotis-me/react";
import { THEME_OPTIONS, useTheme } from "./useTheme";

// Selector de tema en desplegable para quien no tiene sesión: «Claro», «Oscuro» y «Sistema» (specs/channel-site,
// «Claro y oscuro»). El disparador es solo icono, así mide lo mismo con cualquier opción y la cabecera no se mueve.
// Sin `id` fijos: con `mobileActions`, la cabecera lo pinta dos veces. Con sesión, el tema va en `AccountMenu`.
export function ThemeMenu() {
	const [theme, choose] = useTheme();
	const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];
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
			items={THEME_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }))}
			selectedValue={theme}
			onSelectionChange={choose}
		/>
	);
}
