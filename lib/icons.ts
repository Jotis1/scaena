// Iconos de Untitled UI (los de Regula desde 0.8). Las props de icono de Regula aceptan el componente o un nodo,
// no un nombre; el perfil, que es contenido, sigue guardando el nombre y aquí se traduce (design.md, decisión 1).
import type { Button } from "@jotis-me/react";
import { Clock, InfoCircle, Link01, Play, ShieldTick } from "@untitledui/icons";
import type { ComponentProps } from "react";

/** Lo que acepta una prop de icono de Regula: un componente de `@untitledui/icons` o un nodo. */
export type IconProp = NonNullable<ComponentProps<typeof Button>["iconLeading"]>;

/** Iconos que el perfil puede nombrar, en kebab-case. Un nombre fuera de esta lista no pasa la validación. */
export const PROFILE_ICONS = {
	clock: Clock,
	"info-circle": InfoCircle,
	"link-01": Link01,
	play: Play,
	"shield-tick": ShieldTick,
} as const;

export type ProfileIconName = keyof typeof PROFILE_ICONS;

export const PROFILE_ICON_NAMES = Object.keys(PROFILE_ICONS) as [ProfileIconName, ...ProfileIconName[]];
