"use client";

import {
	Badge,
	Button,
	CamFrame,
	ChatBox,
	Icon,
	type IconName,
	Input,
	Modal,
	Select,
	StreamAlert,
	StreamEvents,
	StreamGoal,
	StreamScene,
	StreamStatus,
	Toggle,
} from "@jotis-me/react";
import { type ReactNode, useState } from "react";
import { CAMERA_HOLE, ChattingLayout, GameLayout } from "@/components/overlay/scenes/layouts";
import { GOAL_LABELS, type GoalType } from "@/lib/alerts/goal";
import { type AlertPhrases, fillPhrase } from "@/lib/alerts/phrase";
import { maskToken, type SourceKind, type SourceOptions, sourceUrl } from "@/lib/studio/overlay-urls";
import { TEST_ALERTS } from "@/lib/studio/test-alerts";
import type { AlertType } from "@/lib/twitch/eventsub/event";
import { SAMPLE_CHAT, SAMPLE_EVENTS } from "./samples";

export interface SceneCopy {
	badge: string;
	title: string;
	subtitle: string;
}

export interface OverlaySourcesProps {
	origin: string;
	channel: string;
	token: string;
	cameraName: string;
	footer: string;
	scenes: Record<"starting" | "brb" | "ending" | "offline", SceneCopy>;
	phrases: AlertPhrases;
}

const PHRASE_LABELS: Record<AlertType, string> = {
	follow: "Follow",
	sub: "Sub",
	resub: "Renovación",
	gift: "Subs regaladas",
	raid: "Raid",
	bits: "Bits",
};

// Estudio · Overlays (diseño: «Overlays»; specs/obs-overlays, «Página de URLs para copiar», «Rotar el token» y
// «Frases de alerta editables»). Un solo botón principal: el de confirmar en el modal de rotar.
export function OverlaySources(p: OverlaySourcesProps) {
	const [token, setToken] = useState(p.token);
	const [phrases, setPhrases] = useState(p.phrases);
	const [opts, setOpts] = useState<Record<SourceKind, SourceOptions>>({
		chat: { translucent: true, animate: true },
		alerts: { message: true },
		events: { rows: 5 },
		goal: { goalType: "subs", label: GOAL_LABELS.subs, start: 284, goal: 300 },
		status: { viewers: false },
		camera: { ratio: "16:9", name: p.cameraName },
		"scene/game": { translucent: true, camera: true, events: true, goalPiece: true },
		"scene/chatting": { events: true, goalPiece: true },
		"scene/starting": { minutes: 5 },
		"scene/brb": { minutes: 8 },
		"scene/ending": { next: p.footer },
		"scene/offline": { next: p.footer },
	});
	const set = (kind: SourceKind, patch: SourceOptions) =>
		setOpts((o) => ({ ...o, [kind]: { ...o[kind], ...patch } }));
	const ctx = { origin: p.origin, channel: p.channel, token };

	const card = (kind: SourceKind, c: Omit<SourceCardProps, "kind" | "ctx" | "options">) => (
		<SourceCard key={kind} kind={kind} ctx={ctx} options={opts[kind]} {...c} />
	);
	const o = opts;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="font-display text-display-sm font-semibold text-primary">Overlays</h1>
				<p className="max-w-180 text-md text-tertiary">
					Copia la URL y pégala en OBS como fuente de navegador. El fondo ya viene transparente.
				</p>
			</div>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
				<TokenCard token={token} onRotated={setToken} />
				<TestAlertsCard />
			</div>

			<div className="flex items-baseline justify-between gap-3 pt-2">
				<h2 className="text-lg font-semibold text-primary">Fuentes de navegador</h2>
				<span className="text-sm text-tertiary">6 piezas y 6 escenas</span>
			</div>

			{card("chat", {
				title: "Chat",
				size: "420 × 520",
				desc: "Los mensajes del chat, anclados abajo y desvanecidos arriba.",
				preview: (
					<Scaled width={420} scale={0.38} box={[160, 190]}>
						<ChatBox
							messages={SAMPLE_CHAT}
							width={420}
							height={500}
							translucent={o.chat.translucent}
						/>
					</Scaled>
				),
				controls: (
					<>
						<Toggle
							size="sm"
							label="Fondo translúcido"
							checked={o.chat.translucent}
							onChange={(v) => set("chat", { translucent: v })}
						/>
						<Toggle
							size="sm"
							label="Animar el último mensaje"
							checked={o.chat.animate}
							onChange={(v) => set("chat", { animate: v })}
						/>
					</>
				),
			})}

			{card("alerts", {
				title: "Alertas",
				size: "480 de ancho",
				desc: "Una alerta cada vez, en cola. Follows, subs, renovaciones, regalos, raids y bits.",
				preview: (
					<Scaled width={480} scale={0.65} box={[312, 80]}>
						<StreamAlert
							type="sub"
							user="[usuario]"
							tier={1}
							detail={fillPhrase(phrases.sub, { type: "sub" })}
						/>
					</Scaled>
				),
				controls: (
					<>
						<Toggle
							size="sm"
							label="Enseñar el mensaje del espectador"
							checked={o.alerts.message}
							onChange={(v) => set("alerts", { message: v })}
						/>
						<PhraseEditor phrases={phrases} onSaved={setPhrases} />
					</>
				),
			})}

			{card("events", {
				title: "Eventos",
				size: "360 de ancho",
				desc: "Lo último que ha pasado, para cuando la alerta ya se ha ido.",
				preview: (
					<Scaled width={360} scale={0.55} box={[198, 190]}>
						<StreamEvents items={SAMPLE_EVENTS} max={o.events.rows} />
					</Scaled>
				),
				controls: (
					<div className="w-40">
						<Select
							label="Filas visibles"
							size="sm"
							value={String(o.events.rows)}
							onChange={(e) => set("events", { rows: Number(e.target.value) })}
							options={["3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))}
						/>
					</div>
				),
			})}

			{card("goal", {
				title: "Meta",
				size: "420 de ancho",
				desc: "Una barra de avance. Como mucho dos metas a la vez.",
				preview: (
					<Scaled width={420} scale={0.75} box={[315, 90]}>
						<StreamGoal
							label={o.goal.label || GOAL_LABELS[o.goal.goalType ?? "subs"]}
							current={o.goal.start ?? 0}
							goal={Math.max(1, o.goal.goal ?? 1)}
						/>
					</Scaled>
				),
				controls: (
					<>
						<div className="w-38">
							<Select
								label="Tipo"
								size="sm"
								value={o.goal.goalType}
								onChange={(e) => {
									const goalType = e.target.value as GoalType;
									set("goal", { goalType, label: GOAL_LABELS[goalType] });
								}}
								options={[
									{ value: "subs", label: "Subs" },
									{ value: "follows", label: "Seguidores" },
									{ value: "bits", label: "Bits" },
								]}
							/>
						</div>
						<div className="w-45">
							<Input
								label="Texto"
								size="sm"
								value={o.goal.label}
								maxLength={40}
								onChange={(e) => set("goal", { label: e.target.value })}
							/>
						</div>
						<div className="w-25">
							<Input
								label="Empieza en"
								size="sm"
								inputMode="numeric"
								value={String(o.goal.start ?? 0)}
								onChange={(e) =>
									set("goal", { start: Number(e.target.value.replace(/\D/g, "")) || 0 })
								}
							/>
						</div>
						<div className="w-25">
							<Input
								label="Meta"
								size="sm"
								inputMode="numeric"
								value={String(o.goal.goal ?? 0)}
								onChange={(e) =>
									set("goal", { goal: Number(e.target.value.replace(/\D/g, "")) || 0 })
								}
							/>
						</div>
					</>
				),
			})}

			{card("status", {
				title: "Estado",
				size: "Píldora",
				desc: "En directo, tiempo en emisión, espectadores y categoría.",
				preview: (
					<StreamStatus
						status="live"
						uptime="2:14:05"
						category="Elden Ring"
						viewers={o.status.viewers ? 1284 : undefined}
					/>
				),
				controls: (
					<Toggle
						size="sm"
						label="Enseñar espectadores"
						checked={o.status.viewers}
						onChange={(v) => set("status", { viewers: v })}
					/>
				),
			})}

			{card("camera", {
				title: "Cámara",
				size: o.camera.ratio ?? "16:9",
				desc: "El marco de la cámara, vacío por dentro: la cámara la pone OBS debajo.",
				preview: (
					<CamFrame
						ratio={(o.camera.ratio ?? "16:9") as "16:9"}
						width={o.camera.ratio === "16:9" ? 300 : 200}
						live
						name={o.camera.name || p.cameraName}
					/>
				),
				controls: (
					<>
						<div className="w-35">
							<Select
								label="Proporción"
								size="sm"
								value={o.camera.ratio}
								onChange={(e) => set("camera", { ratio: e.target.value })}
								options={["16:9", "4:3", "1:1"].map((v) => ({ value: v, label: v }))}
							/>
						</div>
						<div className="w-45">
							<Input
								label="Nombre"
								size="sm"
								maxLength={40}
								value={o.camera.name}
								onChange={(e) => set("camera", { name: e.target.value })}
							/>
						</div>
					</>
				),
			})}

			{card("scene/game", {
				title: "Escena - Juego",
				size: "1920 × 1080",
				desc: "Estado, alertas, meta, chat, eventos y marco de cámara, con el centro libre. El juego y la cámara los pone OBS debajo.",
				fill: true,
				preview: (
					<Scaled width={1920} scale={0.1875} box={[360, 202]}>
						<GameLayout
							status={<StreamStatus status="live" uptime="2:14:05" category="Elden Ring" />}
							alerts={
								<StreamAlert
									type="raid"
									user="[canal]"
									amount={1284}
									detail={fillPhrase(phrases.raid, { type: "raid", amount: 1284 })}
								/>
							}
							goal={
								o["scene/game"].goalPiece ? (
									<StreamGoal
										label={GOAL_LABELS.subs}
										current={284}
										goal={300}
										width={400}
									/>
								) : null
							}
							chat={
								<ChatBox
									messages={SAMPLE_CHAT}
									width={400}
									height={440}
									translucent={o["scene/game"].translucent}
								/>
							}
							events={
								o["scene/game"].events ? (
									<StreamEvents items={SAMPLE_EVENTS} max={4} width={384} />
								) : null
							}
							camera={
								o["scene/game"].camera ? (
									<CamFrame ratio="16:9" width={384} live name={p.cameraName} />
								) : null
							}
						/>
					</Scaled>
				),
				controls: (
					<>
						<Toggle
							size="sm"
							label="Chat translúcido"
							checked={o["scene/game"].translucent}
							onChange={(v) => set("scene/game", { translucent: v })}
						/>
						<Toggle
							size="sm"
							label="Marco de cámara"
							checked={o["scene/game"].camera}
							onChange={(v) => set("scene/game", { camera: v })}
						/>
						<Toggle
							size="sm"
							label="Eventos"
							checked={o["scene/game"].events}
							onChange={(v) => set("scene/game", { events: v })}
						/>
						<Toggle
							size="sm"
							label="Meta"
							checked={o["scene/game"].goalPiece}
							onChange={(v) => set("scene/game", { goalPiece: v })}
						/>
					</>
				),
			})}

			{card("scene/chatting", {
				title: "Escena - Just Chatting",
				size: "1920 × 1080",
				desc: "La cámara grande, el chat al lado y la meta y los eventos debajo. La cámara la pone OBS.",
				fill: true,
				preview: (
					<Scaled width={1920} scale={0.1875} box={[360, 202]}>
						<ChattingLayout
							status={<StreamStatus status="live" uptime="2:14:05" category="Just Chatting" />}
							alerts={
								<StreamAlert
									type="resub"
									user="[espectador]"
									months={14}
									detail={fillPhrase(phrases.resub, { type: "resub", months: 14 })}
								/>
							}
							goal={
								o["scene/chatting"].goalPiece ? (
									<StreamGoal
										label={GOAL_LABELS.subs}
										current={284}
										goal={300}
										width={400}
									/>
								) : null
							}
							events={
								o["scene/chatting"].events ? (
									<StreamEvents items={SAMPLE_EVENTS} max={2} width={400} />
								) : null
							}
							camera={
								<CamFrame ratio="16:9" width={CAMERA_HOLE.width} live name={p.cameraName} />
							}
							chat={<ChatBox messages={SAMPLE_CHAT} width={528} height={736} />}
						/>
					</Scaled>
				),
				controls: (
					<>
						<Toggle
							size="sm"
							label="Eventos"
							checked={o["scene/chatting"].events}
							onChange={(v) => set("scene/chatting", { events: v })}
						/>
						<Toggle
							size="sm"
							label="Meta"
							checked={o["scene/chatting"].goalPiece}
							onChange={(v) => set("scene/chatting", { goalPiece: v })}
						/>
					</>
				),
			})}

			{(["starting", "brb", "ending", "offline"] as const).map((v) => {
				const kind = `scene/${v}` as const;
				const copy = p.scenes[v];
				const countdown = v === "starting" || v === "brb";
				return card(kind, {
					title: SCENE_TITLES[v],
					size: "1920 × 1080",
					desc: SCENE_DESCS[v],
					fill: true,
					preview: (
						<div className="absolute inset-0">
							<StreamScene
								variant={v}
								badge={copy.badge}
								title={copy.title}
								subtitle={copy.subtitle}
								seconds={countdown ? (o[kind].minutes ?? 0) * 60 : undefined}
								paused
								channel={p.channel}
								handle={`twitch.tv/${p.channel}`}
								next={countdown ? undefined : o[kind].next}
								scale={0.1875}
							/>
						</div>
					),
					controls: countdown ? (
						<div className="w-45">
							<Input
								label="Cuenta atrás (min)"
								size="sm"
								inputMode="numeric"
								value={String(o[kind].minutes ?? "")}
								onChange={(e) =>
									set(kind, {
										minutes: Math.min(
											180,
											Number(e.target.value.replace(/\D/g, "")) || 0,
										),
									})
								}
							/>
						</div>
					) : (
						<div className="w-80 max-w-full">
							<Input
								label="Línea del pie"
								size="sm"
								maxLength={80}
								value={o[kind].next}
								onChange={(e) => set(kind, { next: e.target.value })}
							/>
						</div>
					),
				});
			})}
		</div>
	);
}

const SCENE_TITLES = {
	starting: "Escena - Empezando",
	brb: "Escena - Vuelvo enseguida",
	ending: "Escena - Final",
	offline: "Escena - Offline",
};
const SCENE_DESCS = {
	starting: "Pantalla completa con cuenta atrás.",
	brb: "Pantalla completa con cuenta atrás.",
	ending: "Para despedir el directo.",
	offline: "También sirve como imagen del canal sin directo.",
};

/** Pieza a su tamaño real, encogida para la vista previa. */
function Scaled({
	width,
	scale,
	box: [w, h],
	children,
}: {
	width: number;
	scale: number;
	box: [number, number];
	children: ReactNode;
}) {
	return (
		<div className="relative overflow-hidden" style={{ width: w, height: h }}>
			<div className="origin-top-left" style={{ width, transform: `scale(${scale})` }}>
				{children}
			</div>
		</div>
	);
}

interface SourceCardProps {
	kind: SourceKind;
	ctx: { origin: string; channel: string; token: string };
	options: SourceOptions;
	title: string;
	size: string;
	desc: string;
	preview: ReactNode;
	controls: ReactNode;
	/** La vista previa ocupa todo el recuadro (escenas). */
	fill?: boolean;
}

function SourceCard({ kind, ctx, options, title, size, desc, preview, controls, fill }: SourceCardProps) {
	const [now, setNow] = useState(() => Date.now());
	const [copied, setCopied] = useState(false);
	const url = sourceUrl(kind, options, { ...ctx, now });
	const copy = async () => {
		// La meta cuenta desde que se copia: `since` es ahora.
		const fresh = Date.now();
		setNow(fresh);
		await navigator.clipboard.writeText(sourceUrl(kind, options, { ...ctx, now: fresh }));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	const id = `src-${kind.replace("/", "-")}`;
	return (
		<article aria-labelledby={id} className="flex flex-wrap gap-6 rounded-xl border border-secondary p-5">
			<div
				data-preview={kind}
				className={`dark-mode relative flex h-[202px] max-w-full flex-[0_0_360px] items-center justify-center overflow-hidden rounded-lg bg-primary ${CHECKER}`}
			>
				{fill ? <div className="absolute inset-0">{preview}</div> : preview}
			</div>
			<div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
				<div className="flex flex-wrap items-center gap-2">
					<h3 id={id} className="text-md font-semibold text-primary">
						{title}
					</h3>
					<Badge color="gray" type="badge" size="sm">
						{size}
					</Badge>
				</div>
				<p className="-mt-2.5 text-sm text-tertiary">{desc}</p>
				<div className="flex flex-wrap items-end gap-x-5 gap-y-3">{controls}</div>
				<div className="flex items-end gap-2">
					<div className="min-w-0 flex-auto">
						<Input
							label="URL para OBS"
							size="sm"
							readOnly
							value={maskToken(url, ctx.token)}
							className="font-mono"
							data-url={kind}
						/>
					</div>
					<Button
						hierarchy="secondary"
						size="sm"
						iconLeading={copied ? "check" : "copy-01"}
						onClick={copy}
					>
						{copied ? "Copiada" : "Copiar"}
					</Button>
				</div>
				<p className="flex items-center gap-1.5 text-[13px] leading-[18px] text-tertiary">
					<Icon name="info-circle" size={16} className="text-fg-quaternary" />
					<span>En OBS, activa «Actualizar al hacer visible la escena» en esta fuente.</span>
				</p>
			</div>
		</article>
	);
}

/** Cuadros de transparencia de la vista previa, con los tokens del tema oscuro (como se ve en OBS). */
const CHECKER =
	"bg-[length:16px_16px] bg-[position:0_0,8px_8px] bg-[image:linear-gradient(45deg,var(--bg-secondary)_25%,transparent_25%,transparent_75%,var(--bg-secondary)_75%),linear-gradient(45deg,var(--bg-secondary)_25%,transparent_25%,transparent_75%,var(--bg-secondary)_75%)]";

function TokenCard({ token, onRotated }: { token: string; onRotated: (t: string) => void }) {
	const [confirming, setConfirming] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const rotate = async () => {
		setBusy(true);
		setError(undefined);
		try {
			const res = await fetch("/api/studio/token", { method: "POST" });
			if (!res.ok) throw new Error(String(res.status));
			onRotated(((await res.json()) as { token: string }).token);
			setConfirming(false);
		} catch {
			setError("No se ha podido rotar. El token de antes sigue valiendo; vuelve a intentarlo.");
		} finally {
			setBusy(false);
		}
	};
	return (
		<section aria-labelledby="tok" className="flex flex-col gap-4 rounded-xl border border-secondary p-6">
			<div className="flex flex-col gap-1">
				<h2 id="tok" className="text-md font-semibold text-primary">
					Token de los overlays
				</h2>
				<p className="text-sm text-tertiary">
					Va en las URL de alertas, eventos y meta. Si se filtra, rótalo: las URL viejas dejan de
					funcionar y toca pegarlas otra vez en OBS.
				</p>
			</div>
			<div className="flex flex-wrap items-end gap-3">
				<div className="min-w-0 flex-[1_1_220px]">
					<Input
						label="Token"
						readOnly
						value={`••••••••••••••••••••${token.slice(-4)}`}
						icon="lock-01"
						className="font-mono"
					/>
				</div>
				<Button
					hierarchy="secondary"
					size="md"
					destructive
					iconLeading="refresh-cw-01"
					onClick={() => setConfirming(true)}
				>
					Rotar token
				</Button>
			</div>
			{error ? (
				<p role="alert" className="text-sm text-error-primary">
					{error}
				</p>
			) : null}
			<Modal
				open={confirming}
				icon="refresh-cw-01"
				destructive
				title="¿Rotar el token?"
				description="Se genera uno nuevo y el actual deja de valer al momento. Las URL con token (alertas, eventos y meta) dejan de funcionar hasta que pegues las nuevas en OBS."
				onClose={() => setConfirming(false)}
				actions={
					<div className="flex w-full gap-3">
						<Button
							hierarchy="secondary"
							size="lg"
							className="flex-1"
							onClick={() => setConfirming(false)}
						>
							Cancelar
						</Button>
						<Button
							hierarchy="primary"
							size="lg"
							destructive
							className="flex-1"
							loading={busy}
							onClick={rotate}
						>
							Rotar token
						</Button>
					</div>
				}
			/>
		</section>
	);
}

function TestAlertsCard() {
	const [sent, setSent] = useState<string>();
	const [error, setError] = useState<string>();
	const send = async (type: string, label: string) => {
		setError(undefined);
		const res = await fetch("/api/studio/test", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ type }),
		}).catch(() => null);
		if (res?.ok) setSent(label);
		else setError("No ha salido. Comprueba la conexión y vuelve a probar.");
	};
	return (
		<section
			aria-labelledby="test"
			className="flex flex-col gap-4 rounded-xl border border-secondary p-6"
		>
			<div className="flex flex-col gap-1">
				<h2 id="test" className="text-md font-semibold text-primary">
					Alertas de prueba
				</h2>
				<p className="text-sm text-tertiary">
					Salen solo en la fuente de alertas, con la frase de cada tipo. En el chat no aparecen.
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{TEST_ALERTS.map((t) => (
					<Button
						key={t.type}
						hierarchy="secondary"
						size="sm"
						iconLeading={t.icon as IconName}
						onClick={() => send(t.type, t.label)}
					>
						{t.label}
					</Button>
				))}
			</div>
			<p aria-live="polite" className="text-sm text-tertiary">
				{error ?? (sent ? `Enviada: ${sent}.` : "")}
			</p>
		</section>
	);
}

function PhraseEditor({ phrases, onSaved }: { phrases: AlertPhrases; onSaved: (p: AlertPhrases) => void }) {
	const [draft, setDraft] = useState(phrases);
	const [errors, setErrors] = useState<Partial<Record<AlertType, string>>>({});
	const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
	const save = async () => {
		setStatus("saving");
		const res = await fetch("/api/studio/settings", {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ alerts: draft }),
		}).catch(() => null);
		if (res?.ok) {
			const body = (await res.json()) as { alerts: AlertPhrases };
			setErrors({});
			setDraft(body.alerts);
			onSaved(body.alerts);
			setStatus("saved");
			return;
		}
		const body = res ? ((await res.json().catch(() => ({}))) as { fields?: Record<string, string> }) : {};
		setErrors(body.fields ?? {});
		setStatus("failed");
	};
	return (
		<>
			<div className="grid basis-full grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
				{(Object.keys(PHRASE_LABELS) as AlertType[]).map((t) => (
					<Input
						key={t}
						label={PHRASE_LABELS[t]}
						size="sm"
						maxLength={120}
						value={draft[t]}
						error={errors[t]}
						onChange={(e) => {
							setDraft((d) => ({ ...d, [t]: e.target.value }));
							setStatus("idle");
						}}
					/>
				))}
			</div>
			<p className="basis-full text-[13px] leading-[18px] text-tertiary">
				Una frase por tipo. Lo que va entre llaves se rellena solo: {"{meses}"}, {"{cantidad}"},{" "}
				{"{espectadores}"} y {"{bits}"}. Vacía, vuelve la del perfil.
			</p>
			<div className="flex basis-full items-center gap-3">
				<Button
					hierarchy="secondary"
					size="sm"
					iconLeading="check"
					loading={status === "saving"}
					onClick={save}
				>
					Guardar frases
				</Button>
				<span aria-live="polite" className="text-sm text-tertiary">
					{status === "saved"
						? "Guardadas. La próxima alerta ya sale con ellas."
						: status === "failed"
							? "Hay frases que no se pueden guardar: mira el mensaje debajo de cada una."
							: ""}
				</span>
			</div>
		</>
	);
}
