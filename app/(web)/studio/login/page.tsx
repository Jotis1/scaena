import { Alert, AppIcon, BackgroundPattern } from "@jotis-me/react";
import type { Metadata } from "next";
import { SignInWithTwitch } from "@/components/studio/SignInWithTwitch";
import { ThemeToggle } from "@/components/web/ThemeToggle";
import { ERROR_NOT_ALLOWED } from "@/lib/auth";

export const metadata: Metadata = { title: "Entra en el Estudio · Scaena", robots: { index: false } };

// Entrada al estudio (diseño: «Entrada» y «Cuenta sin acceso»; specs/obs-overlays, «Acceso al estudio»).
export default async function StudioLogin({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; account?: string; id?: string }>;
}) {
	const { error, account, id } = await searchParams;
	// La cuenta con la que se ha entrado (diseño: «Has entrado como …»). Solo el nombre de usuario de Twitch y su id.
	const who =
		account && /^\w{1,25}$/.test(account)
			? `${account}${id && /^\d+$/.test(id) ? ` (id ${id})` : ""}`
			: null;
	const denied = error === ERROR_NOT_ALLOWED;
	const failed = Boolean(error) && !denied;

	return (
		<div className="relative flex min-h-screen flex-col overflow-hidden bg-secondary">
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<BackgroundPattern pattern="grid-dot" size="lg" mask="radial" className="size-full" />
			</div>
			<header className="relative flex items-center gap-2.5 px-8 py-4">
				<AppIcon letters="Sc" hue="lime" size={32} label="Scaena" />
				<span className="font-display text-xl font-bold text-primary">Scaena</span>
				<span className="ml-auto" />
				<ThemeToggle />
			</header>
			<main className="relative flex flex-1 items-center justify-center px-4 pt-8 pb-24">
				<div className="flex w-full max-w-110 flex-col gap-6 rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
					<div className="flex flex-col items-start gap-4">
						<AppIcon letters="Sc" hue="lime" size={48} label="Scaena" />
						<div className="flex flex-col gap-1">
							<h1 className="font-display text-display-xs font-semibold text-primary">
								Entra en el Estudio
							</h1>
							<p className="text-md text-tertiary">
								Overlays para OBS, paneles y banner del perfil y la conexión con Twitch. Se
								entra con tu cuenta de Twitch.
							</p>
						</div>
					</div>

					{denied ? (
						<Alert
							color="warning"
							icon="lock-01"
							title="Esta cuenta no tiene acceso"
							description={`${who ? `Has entrado como ${who}, pero no` : "La cuenta de Twitch con la que has entrado no"} está entre las que pueden usar el Estudio. Si crees que debería, pide acceso a quien lo administra.`}
						/>
					) : null}
					{failed ? (
						<Alert
							color="error"
							title="No se ha podido entrar"
							description="Twitch no ha terminado el inicio de sesión. Vuelve a intentarlo."
						/>
					) : null}

					<SignInWithTwitch otherAccount={denied} />

					<p className="border-t border-secondary pt-5 text-sm text-tertiary">
						Solo entran las cuentas con acceso. Si vienes a ver los directos, la web es{" "}
						<a href="/" className="font-semibold text-brand-secondary">
							scaena.jotis.me
						</a>
						.
					</p>
				</div>
			</main>
		</div>
	);
}
