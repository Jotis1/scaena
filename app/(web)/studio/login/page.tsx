import { Alert, AppIcon } from "@jotis-me/react";
import type { Metadata } from "next";
import { SignInWithTwitch } from "@/components/studio/SignInWithTwitch";
import { SiteHeader } from "@/components/web/SiteHeader";
import { ERROR_NOT_ALLOWED } from "@/lib/auth";

export const metadata: Metadata = { title: "Entra en el Estudio · Scaena", robots: { index: false } };

// Entrada al estudio (diseño: «Acceso» y «Acceso - cuenta sin acceso»; specs/obs-overlays, «Acceso al estudio»): la
// cabecera de la web, sin «Estudio», y una tarjeta centrada.
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
		<div className="flex min-h-screen flex-col bg-secondary">
			<SiteHeader />
			<main className="flex flex-1 items-center justify-center px-[min(32px,4.2%)] pt-12 pb-24">
				<div className="flex w-full max-w-110 flex-col gap-6 rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
					<div className="flex flex-col items-start gap-4">
						<AppIcon app="scaena" size={48} label="Scaena" />
						<div className="flex flex-col gap-1">
							<h1 className="font-display text-display-xs font-semibold text-primary">
								Entra en el Estudio
							</h1>
							<p className="text-md text-tertiary">
								La trastienda del canal: overlays, guía de OBS y conexión con Twitch. Solo
								entra la cuenta del canal; el resto del público se queda en la web, que para
								eso está.
							</p>
						</div>
					</div>

					{denied ? (
						<div role="alert">
							<Alert
								color="error"
								title="Esta cuenta no tiene acceso"
								description={`${who ? `Has entrado como ${who}, que no` : "La cuenta de Twitch con la que has entrado no"} está entre las que pueden usar el Estudio. Si tienes otra cuenta de Twitch, prueba con ella.`}
							/>
						</div>
					) : null}
					{failed ? (
						<div role="alert">
							<Alert
								color="error"
								title="No se ha podido entrar"
								description="Twitch no ha terminado el inicio de sesión. Vuelve a intentarlo."
							/>
						</div>
					) : null}

					<SignInWithTwitch otherAccount={denied} />

					<p className="border-t border-secondary pt-5 text-sm text-tertiary">
						¿Solo venías a mirar?{" "}
						<a
							href="/"
							className="rounded-sm font-semibold text-brand-secondary focus-visible:shadow-focus-ring focus-visible:outline-none"
						>
							Vuelve a la web del canal
						</a>
					</p>
				</div>
			</main>
		</div>
	);
}
