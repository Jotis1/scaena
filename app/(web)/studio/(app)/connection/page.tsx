import { Alert, AvatarLabel, Badge, FeaturedIcon } from "@jotis-me/react";
import type { Metadata } from "next";
import { ConnectButton, DisconnectButton, ReactivateButton } from "@/components/studio/ConnectionActions";
import { TWITCH_SCOPES } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { activeCount, connectionView, revokedNotice, SUBSCRIPTION_LABELS } from "@/lib/studio/connection";
import { requirePageSession } from "@/lib/studio/session";
import { type ConnectionStatus, connectionStatus } from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps } from "@/lib/twitch/server";
import { connectEvents, disconnectEvents } from "./actions";

export const metadata: Metadata = { title: "Conexión · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

const COLUMNS = "grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_120px] gap-4 px-6";

// Conexión con Twitch (diseño: «Conexión», sin conectar, conectado y revocada; specs/twitch-events).
export default async function ConnectionPage() {
	const session = await requirePageSession();
	let status: ConnectionStatus | null = null;
	try {
		status = await connectionStatus(eventSubDeps(), session.channelId);
	} catch (e) {
		console.error(e);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="font-display text-display-sm font-semibold text-primary">
					Conexión con Twitch
				</h1>
				<p className="max-w-180 text-md text-tertiary">
					Con ella, Scaena recibe los eventos del canal (follows, subs, raids, bits) y se los pasa a
					los overlays.
				</p>
			</div>
			{status ? <Status status={status} name={session.name} /> : <Unreachable />}
		</div>
	);
}

function Unreachable() {
	return (
		<Alert
			color="error"
			title="No se ha podido leer el estado en Twitch"
			description="Twitch no ha respondido o ha rechazado las credenciales de la app. Comprueba TWITCH_CLIENT_ID y TWITCH_CLIENT_SECRET y recarga la página."
		/>
	);
}

function Status({ status, name }: { status: ConnectionStatus; name: string }) {
	const view = connectionView(status.rows);
	if (view === "none")
		return (
			<section className="flex flex-col items-center gap-5 rounded-xl border border-secondary px-6 py-12 text-center">
				<FeaturedIcon icon="link-01" color="gray" size="lg" variant="modern" />
				<div className="flex max-w-115 flex-col gap-1">
					<h2 className="text-lg font-semibold text-primary">Eventos sin conectar</h2>
					<p className="text-sm text-tertiary">
						Ya has entrado con Twitch; falta dar de alta las suscripciones de eventos. Hasta
						entonces, el chat y el estado funcionan, pero las alertas, los eventos y la meta no
						reciben nada. Solo se piden permisos de lectura.
					</p>
				</div>
				<ul className="flex flex-wrap justify-center gap-2" aria-label="Permisos">
					{TWITCH_SCOPES.map((s) => (
						<li
							key={s}
							className="rounded-md border border-secondary bg-secondary px-2 py-0.75 font-mono text-xs text-secondary"
						>
							{s}
						</li>
					))}
				</ul>
				<ConnectButton action={connectEvents} />
			</section>
		);

	const notice = revokedNotice(status.rows);
	const firstBroken = status.rows.findIndex((r) => r.state === "revoked" || r.state === "missing");
	return (
		<div className="flex flex-col gap-6">
			{notice ? <Alert color="warning" icon="alert-triangle" {...notice} /> : null}
			<section className="flex flex-wrap items-center gap-4 rounded-xl border border-secondary px-6 py-5">
				<AvatarLabel
					initials={name.charAt(0).toUpperCase()}
					size="md"
					name={name}
					supporting={`twitch.tv/${name}${status.connectedAt ? ` - conectado el ${formatDate(status.connectedAt)}` : ""}`}
				/>
				<Badge color="success" type="pill" size="md" dot>
					Conectado
				</Badge>
				<span className="ml-auto" />
				<DisconnectButton action={disconnectEvents} />
			</section>

			<section aria-labelledby="subs" className="overflow-hidden rounded-xl border border-secondary">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-secondary px-6 py-5">
					<h2 id="subs" className="text-lg font-semibold text-primary">
						Suscripciones de eventos
					</h2>
					<Badge color="gray" type="pill" size="sm">
						{activeCount(status.rows)}
					</Badge>
					<span className="basis-full text-sm text-tertiary">
						Lo que Twitch le cuenta a Scaena. Si una se cae, su overlay deja de enterarse.
					</span>
				</div>
				<table aria-label="Suscripciones de eventos" className="flex flex-col">
					<thead>
						<tr
							className={`${COLUMNS} border-b border-secondary bg-secondary py-3 text-left text-xs font-medium text-tertiary`}
						>
							<th scope="col">Evento</th>
							<th scope="col">Tipo en Twitch</th>
							<th scope="col">Estado</th>
							<th scope="col">
								<span className="sr-only">Acción</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{status.rows.map((r, i) => (
							<tr
								key={r.type}
								className={`${COLUMNS} items-center border-b border-secondary py-3.5 text-sm last:border-b-0`}
							>
								<td className="font-medium text-primary">{SUBSCRIPTION_LABELS[r.type]}</td>
								<td className="font-mono text-[13px] text-tertiary">{r.type}</td>
								<td>
									{r.state === "enabled" ? (
										<Badge color="success" type="pill" size="sm" dot>
											Activa
										</Badge>
									) : r.state === "pending" ? (
										<Badge color="warning" type="pill" size="sm" dot>
											Verificando
										</Badge>
									) : r.state === "revoked" ? (
										<Badge color="error" type="pill" size="sm" dot>
											Revocada
										</Badge>
									) : (
										<Badge color="gray" type="pill" size="sm" dot>
											Sin dar de alta
										</Badge>
									)}
								</td>
								<td className="flex justify-end">
									{r.state === "revoked" || r.state === "missing" ? (
										// Un solo botón principal por vista: el de la primera fila rota.
										<ReactivateButton
											action={connectEvents}
											primary={i === firstBroken}
										/>
									) : null}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	);
}
