import { AppIcon, AvatarLabel, Badge, Icon } from "@jotis-me/react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/studio/SignOutButton";
import { StudioNav, StudioPageName } from "@/components/studio/StudioNav";
import { ThemeToggle } from "@/components/web/ThemeToggle";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Estudio · Scaena", robots: { index: false } };

// Armazón del estudio (diseño: «Estudio»). La sesión se comprueba aquí y otra vez en cada página: `proxy.ts`
// solo mira que haya cookie.
export default async function StudioLayout({ children }: { children: ReactNode }) {
	const session = await requirePageSession();
	return (
		<div className="flex min-h-screen flex-wrap">
			<aside className="flex max-w-66 flex-[1_1_264px] flex-col gap-6 border-r border-secondary bg-secondary px-4 py-5">
				<div className="flex items-center gap-2.5 px-2">
					<AppIcon letters="Sc" hue="lime" size={32} label="Scaena" />
					<span className="font-display text-xl font-bold text-primary">Scaena</span>
					<Badge color="gray" type="badge" size="sm">
						Estudio
					</Badge>
				</div>
				<StudioNav />
				<div className="mt-auto flex items-center gap-2.5 border-t border-secondary px-2 pt-4">
					<AvatarLabel
						initials={session.name.charAt(0).toUpperCase()}
						size="sm"
						name={session.name}
						supporting="Cuenta de Twitch"
					/>
					<span className="ml-auto" />
					<SignOutButton />
				</div>
			</aside>
			<div className="flex min-w-0 flex-[999_1_640px] flex-col">
				<div className="flex items-center gap-3 border-b border-secondary px-8 py-3">
					<span className="text-sm text-tertiary">Estudio</span>
					<Icon name="chevron-right" size={16} className="text-fg-quaternary" />
					<StudioPageName />
					<ThemeToggle />
				</div>
				<main className="flex max-w-280 flex-col gap-6 p-8">{children}</main>
			</div>
		</div>
	);
}
