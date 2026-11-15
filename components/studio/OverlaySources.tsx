"use client";

import {
	Badge,
	ButtonGroup,
	CamFrame,
	ChatBox,
	Input,
	NumberInput,
	ScaledPreview,
	Select,
	StreamAlert,
	StreamEvents,
	StreamGoal,
	StreamScene,
	StreamStatus,
	Tabs,
	Toggle,
	TransparencyGrid,
} from "@jotis-me/react";
import { BookOpen01, Check, Copy01 } from "@untitledui/icons";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CAMERA_HOLE, ChattingLayout, GameLayout } from "@/components/overlay/scenes/layouts";
import { goalUnit } from "@/lib/alerts/goal";
import { type AlertPhrases, fillPhrase } from "@/lib/alerts/phrase";
import type { GoalState } from "@/lib/alerts/saved-goal";
import { CANVAS_IDS, type CanvasId, canvasById, canvasLabel, DEFAULT_CANVAS } from "@/lib/overlay/canvas";
import {
	guideAnchor,
	isScene,
	kindOf,
	PIECE_IDS,
	SCENE_IDS,
	type SourceId,
} from "@/lib/studio/overlay-sources";
import { maskToken, type SourceKind, type SourceOptions, sourceUrl } from "@/lib/studio/overlay-urls";
import { TEST_ALERTS } from "@/lib/studio/test-alerts";
import type { AlertType } from "@/lib/twitch/eventsub/event";
import { DEFAULT_GOAL, GoalEditor } from "./overlays/GoalEditor";
import { PhraseEditor } from "./overlays/PhraseEditor";
import { TokenField } from "./overlays/TokenField";
import { StudioPageHeader } from "./StudioContent";
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
	/** La meta guardada, con su cuenta; `null` si aún no hay. */
	goal: GoalState | null;
	/** La fuente de `?source=` (o de `?tab=scenes`). */
	source: SourceId;
	/** El lienzo de las escenas, de `?canvas=`. */
	canvas: CanvasId;
}

/** Ancho del escenario antes de medirlo: el del diseño a 1440 px. */
const DEFAULT_STAGE = 962;

const TOKEN_NOTE = "Lleva el token: si lo rotas, vuelve a pegarla en OBS.";

/** Lo fijo de cada fuente (diseño: «Overlays»): título, tamaño, para qué sirve y la nota de la URL. */
const SOURCES: Record<
	SourceId,
	{ title: string; size?: string; desc: string; note: string; optionsTitle?: string }
> = {
	chat: {
		title: "Chat",
		size: "420 × 520",
		desc: "Los mensajes, anclados abajo y desvanecidos arriba.",
		note: "Sin token: el chat ya es público.",
	},
	alerts: {
		title: "Alertas",
		size: "480 de ancho",
		desc: "Una cada vez, en cola: follows, subs, renovaciones, regalos, raids y bits.",
		note: TOKEN_NOTE,
		optionsTitle: "Opciones, pruebas y frases",
	},
	events: {
		title: "Eventos",
		size: "360 de ancho",
		desc: "Lo último que ha pasado, para cuando la alerta ya se ha ido.",
		note: TOKEN_NOTE,
	},
	goal: {
		title: "Meta",
		size: "420 de ancho",
		desc: "Una barra de avance. La misma meta en la pieza y en las escenas.",
		note: TOKEN_NOTE,
		optionsTitle: "La meta",
	},
	status: {
		title: "Estado",
		size: "Píldora",
		desc: "En directo, tiempo en emisión y categoría.",
		note: "Sin token: lo que enseña ya es público.",
	},
	camera: {
		title: "Cámara",
		desc: "Solo el marco: la cámara la pone OBS debajo.",
		note: "Sin token: es solo un marco.",
	},
	game: {
		title: "Juego",
		desc: "Estado, alertas, meta, chat, eventos y cámara, con el centro libre para el juego.",
		note: TOKEN_NOTE,
		optionsTitle: "Piezas de la escena",
	},
	chatting: {
		title: "Just Chatting",
		desc: "La cámara en grande, con el chat al lado y la meta y los eventos debajo.",
		note: TOKEN_NOTE,
		optionsTitle: "Piezas de la escena",
	},
	starting: {
		title: "Empezando",
		desc: "Pantalla completa con cuenta atrás, para dar tiempo a llegar.",
		note: "Sin token. La cuenta atrás arranca al activar la escena.",
	},
	brb: {
		title: "Vuelvo enseguida",
		desc: "Pantalla completa con cuenta atrás, para las pausas.",
		note: "Sin token. La cuenta atrás arranca al activar la escena.",
	},
	ending: { title: "Final", desc: "Para despedir el directo.", note: "Sin token." },
	offline: { title: "Offline", desc: "También sirve de imagen del canal sin directo.", note: "Sin token." },
};

/** Ejemplo de cada tipo de alerta para la vista previa: el mismo que manda la prueba. */
const ALERT_SAMPLE = Object.fromEntries(TEST_ALERTS.map((t) => [t.type, t.event])) as Record<
	AlertType,
	(typeof TEST_ALERTS)[number]["event"]
>;

/**
 * Estudio · Overlays (diseño: «Overlays»; specs/obs-overlays, «Página de URLs para copiar»): a la izquierda, «Piezas» /
 * «Escenas» y la lista de fuentes; a la derecha, la elegida, con su vista previa, su URL, su nota y sus opciones. La
 * fuente y el lienzo van en la URL de la página (`?source=game&canvas=3440x1440`). Las vistas previas salen de los
 * layouts de verdad, no de la maqueta (design.md del cambio redesign-studio, decisión 2).
 */
export function OverlaySources(p: OverlaySourcesProps) {
	const router = useRouter();
	const path = usePathname();
	const [sel, setSel] = useState<SourceId>(p.source);
	const [canvasId, setCanvasId] = useState<CanvasId>(p.canvas);
	const [token, setToken] = useState(p.token);
	const [phrases, setPhrases] = useState(p.phrases);
	// Las frases de la vista previa de «Alertas»: las guardadas o lo que se está escribiendo, del último tipo tocado.
	const [alertPreview, setAlertPreview] = useState<{ type: AlertType; phrases: AlertPhrases }>({
		type: "sub",
		phrases: p.phrases,
	});
	const [goal, setGoal] = useState<GoalState>(p.goal ?? DEFAULT_GOAL);
	const [opts, setOpts] = useState<Record<SourceKind, SourceOptions>>({
		chat: { translucent: true, animate: true },
		alerts: { message: true },
		events: { rows: 5 },
		goal: {},
		status: { viewers: false },
		camera: { ratio: "16:9", name: p.cameraName },
		"scene/game": { translucent: true, camera: true, events: true, goalPiece: true },
		"scene/chatting": { events: true, goalPiece: true },
		"scene/starting": { minutes: 5 },
		"scene/brb": { minutes: 8 },
		"scene/ending": { next: p.footer },
		"scene/offline": { next: p.footer },
	});
	const kind = kindOf(sel);
	const scene = isScene(sel);
	const o = opts[kind];
	const set = (patch: SourceOptions) => setOpts((all) => ({ ...all, [kind]: { ...all[kind], ...patch } }));
	const canvas = canvasById(canvasId);
	const stage = useStageWidth();
	const sceneScale = stage.width / canvas.width;

	const go = (next: SourceId, c: CanvasId = canvasId) => {
		setSel(next);
		setCanvasId(c);
		const q = new URLSearchParams({ source: next });
		if (isScene(next) && c !== DEFAULT_CANVAS) q.set("canvas", c);
		router.replace(`${path}?${q}`, { scroll: false });
	};
	const pickCanvas = (id: string) =>
		go(sel, (CANVAS_IDS as string[]).includes(id) ? (id as CanvasId) : DEFAULT_CANVAS);

	const def = SOURCES[sel];
	const size = scene ? canvasLabel(canvas) : sel === "camera" ? (o.ratio ?? "16:9") : def.size;
	const guide = `/studio/guide${canvasId === DEFAULT_CANVAS ? "" : `?canvas=${canvasId}`}#${guideAnchor(sel)}`;
	const goalPiece = (
		<StreamGoal
			label={goal.label}
			current={goal.current}
			goal={Math.max(1, goal.target)}
			unit={goalUnit(goal)}
			width={400}
		/>
	);
	const sceneCopy = (v: "starting" | "brb" | "ending" | "offline") => p.scenes[v];

	const preview: Record<SourceId, () => ReactNode> = {
		chat: () => {
			const scale = Math.min(0.7, (stage.width - 48) / 420);
			return (
				<ScaledPreview
					width={420}
					scale={scale}
					box={[Math.round(420 * scale), Math.round(500 * scale)]}
				>
					<ChatBox messages={SAMPLE_CHAT} width={420} height={500} translucent={o.translucent} />
				</ScaledPreview>
			);
		},
		alerts: () => {
			const scale = Math.min(1, (stage.width - 48) / 480);
			const t = alertPreview.type;
			const e = ALERT_SAMPLE[t];
			return (
				<ScaledPreview
					width={480}
					scale={scale}
					box={[Math.round(480 * scale), Math.round(132 * scale)]}
				>
					<StreamAlert
						type={t}
						user={e.user}
						amount={e.amount}
						months={e.months}
						tier={e.tier}
						detail={fillPhrase(alertPreview.phrases[t] || phrases[t], { type: t, ...e })}
						message={o.message ? e.message : undefined}
					/>
				</ScaledPreview>
			);
		},
		events: () => (
			<div className="w-[min(360px,100%)]">
				<StreamEvents items={SAMPLE_EVENTS} max={o.rows} width="100%" />
			</div>
		),
		goal: () => (
			<div className="w-[min(420px,100%)]">
				<StreamGoal
					label={goal.label}
					current={goal.current}
					goal={Math.max(1, goal.target)}
					unit={goalUnit(goal)}
					width="100%"
				/>
			</div>
		),
		status: () => (
			<StreamStatus
				status="live"
				uptime="2:14:05"
				category="Elden Ring"
				viewers={o.viewers ? 1284 : undefined}
			/>
		),
		camera: () => (
			<div className="w-[min(440px,100%)]">
				<CamFrame
					ratio={(o.ratio ?? "16:9") as "16:9"}
					width="100%"
					live
					name={o.name || p.cameraName}
				/>
			</div>
		),
		game: () => (
			<ScaledPreview width={canvas.width} scale={sceneScale} box={[stage.width, 1080 * sceneScale]}>
				<GameLayout
					width={canvas.width}
					status={<StreamStatus status="live" uptime="2:14:05" category="Elden Ring" />}
					alerts={
						<StreamAlert
							type="raid"
							user="[canal]"
							amount={1284}
							detail={fillPhrase(phrases.raid, { type: "raid", amount: 1284 })}
						/>
					}
					goal={o.goalPiece ? goalPiece : null}
					chat={
						<ChatBox
							messages={SAMPLE_CHAT}
							width={400}
							height={440}
							translucent={o.translucent}
						/>
					}
					events={o.events ? <StreamEvents items={SAMPLE_EVENTS} max={4} width={384} /> : null}
					camera={o.camera ? <CamFrame ratio="16:9" width={384} live name={p.cameraName} /> : null}
				/>
			</ScaledPreview>
		),
		chatting: () => (
			<ScaledPreview width={canvas.width} scale={sceneScale} box={[stage.width, 1080 * sceneScale]}>
				<ChattingLayout
					width={canvas.width}
					status={<StreamStatus status="live" uptime="0:42:10" category="Just Chatting" />}
					alerts={
						<StreamAlert
							type="resub"
							user="[espectador]"
							months={14}
							detail={fillPhrase(phrases.resub, { type: "resub", months: 14 })}
						/>
					}
					goal={o.goalPiece ? goalPiece : null}
					events={o.events ? <StreamEvents items={SAMPLE_EVENTS} max={2} width={400} /> : null}
					camera={<CamFrame ratio="16:9" width={CAMERA_HOLE.width} live name={p.cameraName} />}
					chat={<ChatBox messages={SAMPLE_CHAT} width={528} height={736} />}
				/>
			</ScaledPreview>
		),
		...Object.fromEntries(
			(["starting", "brb", "ending", "offline"] as const).map((v) => [
				v,
				() => {
					const copy = sceneCopy(v);
					const countdown = v === "starting" || v === "brb";
					return (
						<div style={{ width: stage.width, height: 1080 * sceneScale }}>
							<StreamScene
								variant={v}
								badge={copy.badge}
								title={copy.title}
								subtitle={copy.subtitle}
								seconds={countdown ? (o.minutes ?? 0) * 60 : undefined}
								paused
								channel={p.channel}
								handle={`twitch.tv/${p.channel}`}
								next={countdown ? undefined : o.next}
								width={canvas.width}
								scale={sceneScale}
							/>
						</div>
					);
				},
			]),
		),
	} as Record<SourceId, () => ReactNode>;

	const options: Record<SourceId, () => ReactNode> = {
		chat: () => (
			<div className="flex flex-wrap gap-x-10 gap-y-4">
				<Toggle
					size="sm"
					label="Fondo translúcido"
					hint="Deja ver el juego por detrás."
					checked={o.translucent}
					onChange={(v) => set({ translucent: v })}
				/>
				<Toggle
					size="sm"
					label="Animar el último mensaje"
					hint="Entra con un fundido corto."
					checked={o.animate}
					onChange={(v) => set({ animate: v })}
				/>
			</div>
		),
		alerts: () => (
			<div className="flex flex-col gap-5">
				<Toggle
					size="sm"
					label="Enseñar el mensaje del espectador"
					hint="El que escribe al renovar o al mandar bits."
					checked={o.message}
					onChange={(v) => set({ message: v })}
				/>
				<PhraseEditor
					phrases={phrases}
					onSaved={(saved) => {
						setPhrases(saved);
						setAlertPreview((a) => ({ ...a, phrases: saved }));
					}}
					onPreview={(type, draft) => setAlertPreview({ type, phrases: draft })}
				/>
			</div>
		),
		events: () => (
			<div className="w-45">
				<Select
					label="Filas visibles"
					size="sm"
					value={String(o.rows)}
					onChange={(v) => set({ rows: Number(v) })}
					options={["3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))}
				/>
			</div>
		),
		goal: () => <GoalEditor goal={p.goal} onSaved={setGoal} onDraft={setGoal} />,
		status: () => (
			<Toggle
				size="sm"
				label="Enseñar espectadores"
				hint="El número, al lado del tiempo en emisión."
				checked={o.viewers}
				onChange={(v) => set({ viewers: v })}
			/>
		),
		camera: () => (
			<div className="flex flex-wrap gap-4">
				<div className="flex-[0_1_160px]">
					<Select
						label="Proporción"
						size="sm"
						value={o.ratio}
						onChange={(v) => set({ ratio: v })}
						options={["16:9", "4:3", "1:1"].map((v) => ({ value: v, label: v }))}
					/>
				</div>
				<div className="flex-[0_1_260px]">
					<Input
						label="Nombre"
						size="sm"
						maxLength={40}
						value={o.name}
						onChange={(e) => set({ name: e.target.value })}
					/>
				</div>
			</div>
		),
		game: () => (
			<ScenePieces note="Apaga la pieza que no quieras en la escena. El estado, las alertas y el chat van siempre.">
				<Toggle size="sm" label="Cámara" checked={o.camera} onChange={(v) => set({ camera: v })} />
				<Toggle size="sm" label="Eventos" checked={o.events} onChange={(v) => set({ events: v })} />
				<Toggle
					size="sm"
					label="Meta"
					checked={o.goalPiece}
					onChange={(v) => set({ goalPiece: v })}
				/>
				<Toggle
					size="sm"
					label="Chat translúcido"
					checked={o.translucent}
					onChange={(v) => set({ translucent: v })}
				/>
			</ScenePieces>
		),
		chatting: () => (
			<ScenePieces note="Apaga la pieza que no quieras en la escena. La cámara, el chat y las alertas van siempre.">
				<Toggle size="sm" label="Eventos" checked={o.events} onChange={(v) => set({ events: v })} />
				<Toggle
					size="sm"
					label="Meta"
					checked={o.goalPiece}
					onChange={(v) => set({ goalPiece: v })}
				/>
			</ScenePieces>
		),
		starting: () => <Countdown value={o.minutes ?? 0} onChange={(minutes) => set({ minutes })} />,
		brb: () => <Countdown value={o.minutes ?? 0} onChange={(minutes) => set({ minutes })} />,
		ending: () => <FooterLine value={o.next ?? ""} onChange={(next) => set({ next })} />,
		offline: () => <FooterLine value={o.next ?? ""} onChange={(next) => set({ next })} />,
	};

	const list = scene ? SCENE_IDS : PIECE_IDS;
	return (
		<div className="flex flex-col gap-8">
			<StudioPageHeader
				title="Overlays"
				description="Elige una fuente, ajústala, copia su URL y pégala en OBS. Lo que cambies aquí se ve en la vista previa."
				aside={<TokenField token={token} onRotated={setToken} />}
			/>

			<div className="flex flex-wrap items-start gap-x-8 gap-y-6">
				<div className="flex min-w-0 flex-[1_1_220px] flex-col gap-4">
					<Tabs
						type="button-border"
						size="sm"
						fullWidth
						aria-label="Tipo de fuente"
						value={scene ? "scenes" : "pieces"}
						onChange={(id) => go(id === "scenes" ? "game" : "chat")}
						items={[
							{ id: "pieces", label: "Piezas", count: PIECE_IDS.length },
							{ id: "scenes", label: "Escenas", count: SCENE_IDS.length },
						]}
					/>
					<Tabs
						orientation="vertical"
						type="button-gray"
						size="md"
						aria-label="Fuentes"
						value={sel}
						onChange={(id) => go(id as SourceId)}
						items={list.map((id) => ({ id, label: SOURCES[id].title }))}
					/>
				</div>

				<section aria-label={def.title} className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
					<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
						<div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
							<div className="flex flex-wrap items-center gap-3">
								<h2 className="text-xl font-semibold text-primary">{def.title}</h2>
								<Badge color="gray" type="badge" size="md">
									{size}
								</Badge>
							</div>
							<p className="text-sm text-tertiary">{def.desc}</p>
						</div>
						{scene ? (
							<div className="flex flex-col gap-1.5">
								<span aria-hidden="true" className="text-sm font-medium text-secondary">
									Lienzo de las escenas
								</span>
								<ButtonGroup
									size="sm"
									aria-label="Lienzo de las escenas"
									value={canvasId}
									onChange={pickCanvas}
									items={CANVAS_IDS.map((id) => ({
										value: id,
										label: canvasLabel(canvasById(id)),
									}))}
								/>
							</div>
						) : null}
					</div>

					<div
						ref={stage.ref}
						aria-hidden="true"
						data-preview={kind}
						className="dark-mode relative overflow-hidden rounded-xl border border-secondary"
					>
						<TransparencyGrid size="md" className="absolute inset-0" />
						{scene ? (
							<div className="relative">{preview[sel]()}</div>
						) : (
							<div className="relative flex min-h-100 items-center justify-center p-6">
								{preview[sel]()}
							</div>
						)}
					</div>

					<SourceUrl
						kind={kind}
						options={scene ? { ...o, canvas: canvasId } : o}
						ctx={{ origin: p.origin, channel: p.channel, token }}
						note={def.note}
						guide={scene ? guide : undefined}
					/>

					<div className="flex flex-col gap-4 border-t border-secondary pt-5">
						<h3 className="text-md font-semibold text-primary">
							{def.optionsTitle ?? "Opciones"}
						</h3>
						{options[sel]()}
					</div>
				</section>
			</div>
		</div>
	);
}

/** El ancho del escenario, medido: la vista previa se escala a él. */
function useStageWidth() {
	const ref = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(DEFAULT_STAGE);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => {
			const w = Math.round(el.clientWidth);
			if (w > 0) setWidth(w);
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return { ref, width };
}

/** La URL para OBS con «Copiar», el token tapado en pantalla y el de verdad al copiar; `since` es la hora de copiar. */
function SourceUrl({
	kind,
	options,
	ctx,
	note,
	guide,
}: {
	kind: SourceKind;
	options: SourceOptions;
	ctx: { origin: string; channel: string; token: string };
	note: string;
	guide?: string;
}) {
	const [now, setNow] = useState(() => Date.now());
	const [copied, setCopied] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: al cambiar de fuente, el botón vuelve a «Copiar».
	useEffect(() => setCopied(false), [kind]);
	const url = sourceUrl(kind, options, { ...ctx, now });
	const copy = async () => {
		const fresh = Date.now();
		setNow(fresh);
		await navigator.clipboard.writeText(sourceUrl(kind, options, { ...ctx, now: fresh }));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<div className="flex flex-col gap-2">
			<Input
				label="URL para OBS"
				readOnly
				value={maskToken(url, ctx.token)}
				className="[&_input]:font-mono"
				data-url={kind}
				trailingButton={{
					label: copied ? "Copiada" : "Copiar",
					icon: copied ? Check : Copy01,
					onClick: copy,
				}}
			/>
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
				<p className="text-sm text-tertiary">{note}</p>
				{guide ? (
					<a
						href={guide}
						className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-secondary focus-visible:shadow-focus-ring focus-visible:outline-none"
					>
						<BookOpen01 size={20} aria-hidden="true" />
						Cómo montarla en OBS
					</a>
				) : null}
			</div>
		</div>
	);
}

function ScenePieces({ note, children }: { note: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm text-tertiary">{note}</p>
			<div className="flex flex-wrap gap-x-10 gap-y-4">{children}</div>
		</div>
	);
}

function Countdown({ value, onChange }: { value: number; onChange: (n: number) => void }) {
	return (
		<div className="w-55">
			<NumberInput
				label="Cuenta atrás (minutos)"
				min={0}
				max={180}
				value={value}
				onChange={(n) => onChange(Math.min(180, Math.max(0, n || 0)))}
			/>
		</div>
	);
}

function FooterLine({ value, onChange }: { value: string; onChange: (s: string) => void }) {
	return (
		<div className="max-w-130">
			<Input
				label="Texto del pie"
				maxLength={80}
				hint="La línea del centro del pie, como cuándo vuelves."
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}
