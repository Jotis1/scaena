import { Alert, AvatarLabel, Badge, EmptyState, ProgressBar, Table } from "@jotis-me/react";
import { AlertTriangle, Link01 } from "@untitledui/icons";
import type { ReactNode } from "react";
import { TWITCH_SCOPES } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
	activeCount,
	activeProgress,
	connectionView,
	revokedNotice,
	SCOPE_DESCRIPTIONS,
	SUBSCRIPTION_FEEDS,
	SUBSCRIPTION_LABELS,
} from "@/lib/studio/connection";
import type { ConnectionStatus, SubscriptionRow } from "@/lib/twitch/eventsub/subscriptions";
import { ConnectButton, DisconnectButton, ReactivateButton, RetryButton } from "./ConnectionActions";

type Action = () => Promise<{ error?: string }>;

/**
 * Lo que enseña la página de conexión según el estado de las suscripciones (diseño: «Conexión», «Conexión - sin
 * conectar» y «Conexión - error con Twitch»; specs/twitch-events). Las acciones llegan por props: así se prueba sin
 * Twitch. Es un componente de servidor y `Table` es de cliente: a la tabla no le llega ninguna función.
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
			<div className="flex flex-wrap items-stretch gap-6">
				<section
					aria-label="Eventos sin conectar"
					className="flex min-w-0 flex-[3_1_420px] items-center justify-center rounded-xl border border-secondary px-6 py-10"
				>
					<EmptyState
						size="md"
						icon={Link01}
						title="Eventos sin conectar"
						description="Ya has entrado con Twitch; falta dar de alta los eventos. Hasta entonces el chat y el estado funcionan, pero alertas, eventos y meta no reciben nada."
						actions={<ConnectButton action={connect} />}
					/>
				</section>
				<section
					aria-labelledby="scopes-title"
					className="flex min-w-0 flex-[2_1_320px] flex-col gap-4 rounded-xl border border-secondary p-6"
				>
					<div className="flex flex-col gap-1">
						<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
							<h2 id="scopes-title" className="text-md font-semibold text-primary">
								Permisos que se piden
							</h2>
							<Badge color="success" type="pill" size="sm">
								Solo lectura
							</Badge>
						</div>
						<p className="text-sm text-tertiary">
							Tres, y ninguno deja escribir en el chat ni tocar el canal. Scaena mira; no toca.
						</p>
					</div>
					<ul className="flex flex-col" aria-label="Permisos que se piden">
						{TWITCH_SCOPES.map((s) => (
							<li key={s} className="flex flex-col gap-0.5 border-t border-secondary py-3">
								<span className="text-sm font-medium text-primary">
									{SCOPE_DESCRIPTIONS[s]}
								</span>
								<span className="font-mono text-xs text-tertiary">{s}</span>
							</li>
						))}
					</ul>
				</section>
			</div>
		);

	const notice = revokedNotice(status.rows);
	const firstBroken = status.rows.findIndex((r) => r.state === "revoked" || r.state === "missing");
	const progress = activeProgress(status.rows);
	return (
		<div className="flex flex-col gap-6">
			{notice ? <Alert color="warning" icon={AlertTriangle} {...notice} /> : null}
			<AccountCard
				name={name}
				supporting={
					status.connectedAt
						? `Eventos conectados desde el ${formatDate(status.connectedAt)}`
						: `twitch.tv/${name}`
				}
				disconnect={disconnect}
			>
				<div className="flex max-w-105 flex-[1_1_260px] flex-col gap-2">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-sm font-medium text-secondary">Suscripciones activas</span>
						<span className="text-sm font-semibold text-primary tabular-nums">
							{progress.active} de {progress.total}
						</span>
					</div>
					<ProgressBar
						value={progress.percent}
						label={false}
						aria-label={`Suscripciones activas: ${progress.active} de ${progress.total}`}
					/>
				</div>
			</AccountCard>

			<div className="overflow-x-auto">
				<Table
					title="Suscripciones de eventos"
					count={activeCount(status.rows)}
					description="Si una se cae, su overlay deja de enterarse."
					columns={[
						{ key: "label", label: "Evento", primary: true },
						{ key: "type", label: "Tipo en Twitch" },
						{ key: "feeds", label: "Alimenta" },
						{ key: "state", label: "Estado" },
						{ key: "action", label: "Acción", align: "right" },
					]}
					rows={status.rows.map((r, index) => ({
						id: r.type,
						label: SUBSCRIPTION_LABELS[r.type],
						type: <span className="font-mono text-[13px]">{r.type}</span>,
						feeds: SUBSCRIPTION_FEEDS[r.type],
						state: <StateBadge state={r.state} />,
						action:
							r.state === "revoked" || r.state === "missing" ? (
								// Un solo botón principal por vista: el de la primera fila rota.
								<ReactivateButton action={connect} primary={index === firstBroken} />
							) : null,
					}))}
				/>
			</div>
		</div>
	);
}

/** Twitch no responde: el error con «Volver a intentar», y la cuenta, por si hay que desconectar igualmente. */
export function ConnectionUnreachable({ name, disconnect }: { name: string; disconnect: Action }) {
	return (
		<div className="flex flex-col gap-6">
			<Alert
				color="error"
				title="No se puede leer el estado en Twitch"
				description="Twitch no responde o ha rechazado la consulta. Las suscripciones siguen como estaban; lo que falla es poder verlas. Suele arreglarse solo en unos minutos."
				actions={<RetryButton />}
			/>
			<AccountCard name={name} supporting={`twitch.tv/${name}`} disconnect={disconnect} />
		</div>
	);
}

function AccountCard({
	name,
	supporting,
	disconnect,
	children,
}: {
	name: string;
	supporting: string;
	disconnect: Action;
	children?: ReactNode;
}) {
	return (
		<section
			aria-label="Cuenta conectada"
			className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-xl border border-secondary px-6 py-5"
		>
			<AvatarLabel
				initials={name.charAt(0).toUpperCase()}
				size="lg"
				name={name}
				supporting={supporting}
			/>
			{children}
			<DisconnectButton action={disconnect} />
		</section>
	);
}

function StateBadge({ state }: { state: SubscriptionRow["state"] }) {
	const { color, label } = {
		enabled: { color: "success", label: "Activa" },
		pending: { color: "warning", label: "Verificando" },
		revoked: { color: "error", label: "Revocada" },
		missing: { color: "gray", label: "Sin dar de alta" },
	}[state] as { color: "success" | "warning" | "error" | "gray"; label: string };
	return (
		<Badge color={color} type="pill" size="sm" dot>
			{label}
		</Badge>
	);
}
