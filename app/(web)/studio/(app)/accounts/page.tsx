import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountsStudio } from "@/components/studio/accounts/AccountsStudio";
import { StudioContent, StudioPageHeader } from "@/components/studio/StudioContent";
import { env } from "@/lib/env";
import { listAccounts } from "@/lib/studio/accounts";
import { channelRegistry } from "@/lib/studio/channels";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Cuentas · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Cuentas, solo para administradores (specs/studio-accounts). Quien no lo es va a Overlays.
export default async function AccountsPage() {
	const session = await requirePageSession();
	if (!session.admin) redirect("/studio/overlays");
	const accounts = await listAccounts({
		registry: await channelRegistry(),
		adminIds: env().STUDIO_ALLOWED_TWITCH_IDS,
		// Para listar no hace falta Twitch ni tocar sesiones.
		findUser: async () => null,
		endSessions: async () => {},
		unsubscribe: async () => {},
	});
	return (
		<StudioContent>
			<StudioPageHeader
				title="Cuentas"
				description="Quién entra en el estudio. Cada cuenta trabaja con su propio canal: sus overlays, sus metas y sus recursos, sin ver los de las demás."
			/>
			<AccountsStudio initialAccounts={accounts} />
		</StudioContent>
	);
}
