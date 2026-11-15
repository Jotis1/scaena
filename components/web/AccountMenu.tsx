"use client";

import { Avatar, AvatarLabel, Dropdown } from "@jotis-me/react";
import { LogOut01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { THEME_OPTIONS, useTheme } from "./useTheme";

export interface HeaderAccount {
	name: string;
	image?: string;
}

const LOGOUT = "logout";

/**
 * Menú de la cuenta, a la derecha de la cabecera con una sesión del estudio abierta (specs/channel-site, «Menú de la
 * cuenta» y «Claro y oscuro»): el avatar de Twitch abre el nombre, el tema y «Cerrar sesión». El disparador es propio
 * (las variantes `account-*` de `Dropdown` añaden una lista para cambiar de cuenta, que aquí no hay). Sin `id` fijos:
 * con `mobileActions`, la cabecera lo pinta dos veces.
 */
export function AccountMenu({ account }: { account: HeaderAccount }) {
	const router = useRouter();
	const [theme, choose] = useTheme();
	const initials = account.name.charAt(0).toUpperCase();
	const signOut = async () => {
		await authClient.signOut();
		router.replace("/");
		router.refresh();
	};
	return (
		<Dropdown
			aria-label={`Cuenta de ${account.name}`}
			trigger={
				<button
					type="button"
					aria-label={`Cuenta de ${account.name}`}
					className="flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:shadow-focus-ring focus-visible:outline-none"
				>
					<Avatar size="sm" src={account.image} initials={initials} alt="" />
				</button>
			}
			header={
				<AvatarLabel
					size="sm"
					src={account.image}
					initials={initials}
					alt=""
					name={account.name}
					supporting="Cuenta de Twitch"
				/>
			}
			items={[
				{ heading: "Tema" },
				...THEME_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon })),
				{ divider: true },
				{ value: LOGOUT, label: "Cerrar sesión", icon: LogOut01 },
			]}
			selectedValue={theme}
			onSelectionChange={(v) => (v === LOGOUT ? void signOut() : choose(v))}
		/>
	);
}
