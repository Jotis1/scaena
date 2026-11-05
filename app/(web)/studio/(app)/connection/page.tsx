import { Alert, AvatarLabel, Badge, FeaturedIcon, PageHeader, Table } from "@jotis-me/react";
import type { Metadata } from "next";
import { ConnectButton, DisconnectButton, ReactivateButton } from "@/components/studio/ConnectionActions";
import { TWITCH_SCOPES } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { activeCount, connectionView, revokedNotice, SUBSCRIPTION_LABELS } from "@/lib/studio/connection";
import { requirePageSession } from "@/lib/studio/session";
import {
	type ConnectionStatus,
	connectionStatus,
	type SubscriptionRow,
} from "@/lib/twitch/eventsub/subscriptions";
import { eventSubDeps } from "@/lib/twitch/server";
import { connectEvents, disconnectEvents } from "./actions";

export const metadata: Metadata = { title: "Conexión · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

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
			<PageHeader
				title="Conexión con Twitch"
				description="Con ella, Scaena recibe los eventos del canal (follows, subs, raids, bits) y se los pasa a los overlays."
				divider={false}
			/>
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

			<Table
				title="Suscripciones de eventos"
				count={activeCount(status.rows)}
				description="Lo que Twitch le cuenta a Scaena. Si una se cae, su overlay deja de enterarse."
				columns={[
					{ key: "label", label: "Evento", primary: true },
					{
						key: "type",
						label: "Tipo en Twitch",
						render: (r: Row) => <span className="font-mono text-[13px]">{r.type}</span>,
					},
					{ key: "state", label: "Estado", render: (r: Row) => <StateBadge state={r.state} /> },
					{
						key: "action",
						label: <span className="sr-only">Acción</span>,
						align: "right",
						render: (r: Row) =>
							r.state === "revoked" || r.state === "missing" ? (
								// Un solo botón principal por vista: el de la primera fila rota.
								<ReactivateButton action={connectEvents} primary={r.index === firstBroken} />
							) : null,
					},
				]}
				rows={status.rows.map((r, index) => ({ ...r, index, label: SUBSCRIPTION_LABELS[r.type] }))}
			/>
		</div>
	);
}

type Row = SubscriptionRow & { index: number; label: string };

function StateBadge({ state }: { state: SubscriptionRow["state"] }) {
	if (state === "enabled")
		return (
			<Badge color="success" type="pill" size="sm" dot>
				Activa
			</Badge>
		);
	if (state === "pending")
		return (
			<Badge color="warning" type="pill" size="sm" dot>
				Verificando
			</Badge>
		);
	if (state === "revoked")
		return (
			<Badge color="error" type="pill" size="sm" dot>
				Revocada
			</Badge>
		);
	return (
		<Badge color="gray" type="pill" size="sm" dot>
			Sin dar de alta
		</Badge>
	);
}
