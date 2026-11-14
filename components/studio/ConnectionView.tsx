import { Alert, AvatarLabel, Badge, EmptyState, Table } from "@jotis-me/react";
import { AlertTriangle, Link01 } from "@untitledui/icons";
import { TWITCH_SCOPES } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { activeCount, connectionView, revokedNotice, SUBSCRIPTION_LABELS } from "@/lib/studio/connection";
import type { ConnectionStatus, SubscriptionRow } from "@/lib/twitch/eventsub/subscriptions";
import { ConnectButton, DisconnectButton, ReactivateButton } from "./ConnectionActions";

type Action = () => Promise<{ error?: string }>;

/**
 * Lo que enseña la página de conexión según el estado de las suscripciones (diseño: «Conexión - sin conectar»,
 * «conectado» y «suscripción revocada»; specs/twitch-events). Las acciones llegan por props: así se prueba sin Twitch.
 */
export function ConnectionView({
	status,
	name,
	connect,
	disconnect,
}: {
	status: ConnectionStatus;
	name: string;
	connect: Action;
	disconnect: Action;
}) {
	const view = connectionView(status.rows);
	if (view === "none")
		return (
			<section className="flex flex-col items-center gap-5 rounded-xl border border-secondary bg-primary px-6 py-12">
				<EmptyState
					size="md"
					icon={Link01}
					title="Eventos sin conectar"
					description="Ya has entrado con Twitch; falta dar de alta los eventos. Hasta entonces, el chat y el estado funcionan, pero alertas, eventos y meta no reciben nada. Solo se piden permisos de lectura."
					actions={<ConnectButton action={connect} />}
				/>
				<ul className="flex flex-wrap justify-center gap-2" aria-label="Permisos que se piden">
					{TWITCH_SCOPES.map((s) => (
						<li key={s}>
							<Badge color="gray" type="badge" size="md">
								<span className="font-mono">{s}</span>
							</Badge>
						</li>
					))}
				</ul>
			</section>
		);

	const notice = revokedNotice(status.rows);
	const firstBroken = status.rows.findIndex((r) => r.state === "revoked" || r.state === "missing");
	return (
		<div className="flex flex-col gap-6">
			{notice ? <Alert color="warning" icon={AlertTriangle} {...notice} /> : null}
			<section className="flex flex-wrap items-center gap-4 rounded-xl border border-secondary bg-primary px-6 py-5">
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
				<DisconnectButton action={disconnect} />
			</section>

			<Table
				title="Suscripciones de eventos"
				count={activeCount(status.rows)}
				description="Lo que Twitch le cuenta a Scaena. Si una se cae, su overlay deja de enterarse."
				// Este es un componente de servidor y `Table` es de cliente: nada de `render` (una función no cruza la
				// frontera). Las celdas van ya pintadas en cada fila.
				columns={[
					{ key: "label", label: "Evento", primary: true },
					{ key: "type", label: "Tipo en Twitch" },
					{ key: "state", label: "Estado" },
					{ key: "action", label: <span className="sr-only">Acción</span>, align: "right" },
				]}
				rows={status.rows.map((r, index) => ({
					id: r.type,
					label: SUBSCRIPTION_LABELS[r.type],
					type: <span className="font-mono text-[13px]">{r.type}</span>,
					state: <StateBadge state={r.state} />,
					action:
						r.state === "revoked" || r.state === "missing" ? (
							// Un solo botón principal por vista: el de la primera fila rota.
							<ReactivateButton action={connect} primary={index === firstBroken} />
						) : null,
				}))}
			/>
		</div>
	);
}

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
