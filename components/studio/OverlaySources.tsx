"use client";

import {
	CamFrame,
	ChatBox,
	Input,
	NumberInput,
	PageHeader,
	ScaledPreview,
	Select,
	StreamAlert,
	StreamEvents,
	StreamGoal,
	StreamScene,
	StreamStatus,
	Tabs,
	Toggle,
} from "@jotis-me/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CAMERA_HOLE, ChattingLayout, GameLayout } from "@/components/overlay/scenes/layouts";
import { ThemeMenu } from "@/components/web/ThemeMenu";
import { type AlertPhrases, fillPhrase } from "@/lib/alerts/phrase";
import type { GoalState } from "@/lib/alerts/saved-goal";
import { CANVAS_IDS, type CanvasId, canvasById, canvasLabel, DEFAULT_CANVAS } from "@/lib/overlay/canvas";
import type { SourceKind, SourceOptions } from "@/lib/studio/overlay-urls";
import { DEFAULT_GOAL, GoalEditor } from "./overlays/GoalEditor";
import { PhraseEditor } from "./overlays/PhraseEditor";
import { SourceCard, type SourceCardProps } from "./overlays/SourceCard";
import { TestAlertsCard } from "./overlays/TestAlertsCard";
import { TokenCard } from "./overlays/TokenCard";
import { SAMPLE_CHAT, SAMPLE_EVENTS } from "./samples";

export interface SceneCopy {
	badge: string;
	title: string;
	subtitle: string;
}

export type OverlayTab = "pieces" | "scenes";

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
	/** La pestaña de `?tab=`: «Piezas» o «Escenas». */
	tab: OverlayTab;
	/** El lienzo de las escenas, de `?canvas=`. */
	canvas: CanvasId;
}

/** Ancho de la caja de la vista previa. Una escena de 1920 × 1080 cabe en 360 × 202; una de 3440 × 1440, en 360 × 151. */
const PREVIEW_WIDTH = 360;
/** Sección de la guía de OBS de cada escena; las de pantalla completa van juntas. */
const GUIDE_ANCHORS: Partial<Record<SourceKind, string>> = {
	"scene/game": "game",
	"scene/chatting": "chatting",
};

const PREVIEW_HEIGHTS: Record<CanvasId, number> = { "1920x1080": 202, "3440x1440": 151 };

const SCENE_TITLES = { starting: "Empezando", brb: "Vuelvo enseguida", ending: "Final", offline: "Offline" };
const SCENE_DESCS = {
	starting: "Pantalla completa con cuenta atrás.",
	brb: "Pantalla completa con cuenta atrás.",
	ending: "Para despedir el directo.",
	offline: "También sirve de imagen del canal sin directo.",
};

// Estudio · Overlays (diseño: «Overlays - piezas», «Overlays - escenas» y «Rotar token»; specs/obs-overlays,
// «Página de URLs para copiar», «Rotar el token» y «Frases de alerta editables»). Arriba, el token y las alertas de
// prueba; debajo, las doce fuentes en dos pestañas. La pestaña va en la URL (`?tab=scenes`), y en «Escenas», el lienzo
// (`&canvas=3440x1440`), que cambia las vistas previas, el tamaño y la URL de las seis.
export function OverlaySources(p: OverlaySourcesProps) {
	const router = useRouter();
	const path = usePathname();
	const [tab, setTab] = useState<OverlayTab>(p.tab);
	const [canvasId, setCanvasId] = useState<CanvasId>(p.canvas);
	const canvas = canvasById(canvasId);
	const sceneScale = PREVIEW_WIDTH / canvas.width;
	const sceneBox: [number, number] = [PREVIEW_WIDTH, PREVIEW_HEIGHTS[canvasId]];
	const sceneSize = canvasLabel(canvas);
	const [token, setToken] = useState(p.token);
	const [phrases, setPhrases] = useState(p.phrases);
	// La meta de las vistas previas: la guardada, o lo que se está escribiendo.
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
	const set = (kind: SourceKind, patch: SourceOptions) =>
		setOpts((o) => ({ ...o, [kind]: { ...o[kind], ...patch } }));
	const ctx = { origin: p.origin, channel: p.channel, token };
	const o = opts;
	const sceneHref = (c: CanvasId) => `${path}?tab=scenes${c === DEFAULT_CANVAS ? "" : `&canvas=${c}`}`;
	const pickTab = (id: string) => {
		const next = id === "scenes" ? "scenes" : "pieces";
		setTab(next);
		router.replace(next === "scenes" ? sceneHref(canvasId) : path, { scroll: false });
	};
	const pickCanvas = (id: string) => {
		const next = (CANVAS_IDS as string[]).includes(id) ? (id as CanvasId) : DEFAULT_CANVAS;
		setCanvasId(next);
		router.replace(sceneHref(next), { scroll: false });
	};

	const guideHref = (c: CanvasId, kind: SourceKind) =>
		`/studio/guide${c === DEFAULT_CANVAS ? "" : `?canvas=${c}`}#${GUIDE_ANCHORS[kind] ?? "fullscreen"}`;
	const card = (kind: SourceKind, c: Omit<SourceCardProps, "kind" | "ctx" | "options">) => (
		<SourceCard key={kind} kind={kind} ctx={ctx} options={opts[kind]} {...c} />
	);
	// Las escenas llevan el lienzo elegido: en la URL, en la insignia y en la vista previa.
	const sceneCard = (kind: SourceKind, c: Omit<SourceCardProps, "kind" | "ctx" | "options" | "size">) => (
		<SourceCard
			key={kind}
			kind={kind}
			ctx={ctx}
			options={{ ...opts[kind], canvas: canvasId }}
			size={sceneSize}
			previewHeight={sceneBox[1]}
			guide={guideHref(canvasId, kind)}
			{...c}
		/>
	);

	const pieces = [
		card("chat", {
			title: "Chat",
			size: "420 × 520",
			desc: "Los mensajes, anclados abajo y desvanecidos arriba.",
			preview: (
				<ScaledPreview width={420} scale={0.38} box={[160, 190]}>
					<ChatBox
						messages={SAMPLE_CHAT}
						width={420}
						height={500}
						translucent={o.chat.translucent}
					/>
				</ScaledPreview>
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
		}),
		card("alerts", {
			title: "Alertas",
			size: "480 de ancho",
			desc: "Una cada vez, en cola: follows, subs, renovaciones, regalos, raids y bits.",
			preview: (
				<ScaledPreview width={480} scale={0.65} box={[312, 80]}>
					<StreamAlert
						type="sub"
						user="[usuario]"
						tier={1}
						detail={fillPhrase(phrases.sub, { type: "sub" })}
					/>
				</ScaledPreview>
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
		}),
		card("events", {
			title: "Eventos",
			size: "360 de ancho",
			desc: "Lo último que ha pasado, para cuando la alerta ya se ha ido.",
			preview: (
				<ScaledPreview width={360} scale={0.55} box={[198, 190]}>
					<StreamEvents items={SAMPLE_EVENTS} max={o.events.rows} />
				</ScaledPreview>
			),
			controls: (
				<div className="w-40">
					<Select
						label="Filas visibles"
						size="sm"
						value={String(o.events.rows)}
						onChange={(v) => set("events", { rows: Number(v) })}
						options={["3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))}
					/>
				</div>
			),
		}),
		card("goal", {
			title: "Meta",
			size: "420 de ancho",
			desc: "Una barra de avance. La misma meta en la pieza y en las escenas.",
			preview: (
				<ScaledPreview width={420} scale={0.75} box={[315, 90]}>
					<StreamGoal
						label={goal.label}
						current={goal.current}
						goal={Math.max(1, goal.target)}
						unit={goal.unit}
					/>
				</ScaledPreview>
			),
			controls: <GoalEditor goal={p.goal} onSaved={setGoal} onDraft={setGoal} />,
		}),
		card("status", {
			title: "Estado",
			size: "Píldora",
			desc: "En directo, tiempo en emisión y categoría.",
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
		}),
		card("camera", {
			title: "Cámara",
			size: o.camera.ratio ?? "16:9",
			desc: "Solo el marco: la cámara la pone OBS debajo.",
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
							onChange={(v) => set("camera", { ratio: v })}
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
		}),
	];

	const scenes = [
		sceneCard("scene/game", {
			title: "Juego",
			desc: "Estado, alertas, meta, chat, eventos y cámara, con el centro libre para el juego.",
			preview: (
				<ScaledPreview
					width={canvas.width}
					scale={sceneScale}
					box={sceneBox}
					className="absolute inset-0"
				>
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
						goal={
							o["scene/game"].goalPiece ? (
								<StreamGoal
									label={goal.label}
									current={goal.current}
									goal={goal.target}
									unit={goal.unit}
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
				</ScaledPreview>
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
		}),
		sceneCard("scene/chatting", {
			title: "Just Chatting",
			desc: "La cámara grande, el chat al lado y la meta y los eventos debajo.",
			preview: (
				<ScaledPreview
					width={canvas.width}
					scale={sceneScale}
					box={sceneBox}
					className="absolute inset-0"
				>
					<ChattingLayout
						width={canvas.width}
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
									label={goal.label}
									current={goal.current}
									goal={goal.target}
									unit={goal.unit}
									width={400}
								/>
							) : null
						}
						events={
							o["scene/chatting"].events ? (
								<StreamEvents items={SAMPLE_EVENTS} max={2} width={400} />
							) : null
						}
						camera={<CamFrame ratio="16:9" width={CAMERA_HOLE.width} live name={p.cameraName} />}
						chat={<ChatBox messages={SAMPLE_CHAT} width={528} height={736} />}
					/>
				</ScaledPreview>
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
		}),
		...(["starting", "brb", "ending", "offline"] as const).map((v) => {
			const kind = `scene/${v}` as const;
			const copy = p.scenes[v];
			const countdown = v === "starting" || v === "brb";
			return sceneCard(kind, {
				title: SCENE_TITLES[v],
				desc: SCENE_DESCS[v],
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
							width={canvas.width}
							scale={sceneScale}
						/>
					</div>
				),
				controls: countdown ? (
					<div className="w-45">
						<NumberInput
							label="Cuenta atrás (min)"
							size="sm"
							min={0}
							max={180}
							value={o[kind].minutes ?? 0}
							onChange={(n) => set(kind, { minutes: Math.min(180, Math.max(0, n || 0)) })}
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
		}),
	];

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				title="Overlays"
				description="Copia la URL de cada fuente y pégala en OBS como fuente de navegador, con «Actualizar al hacer visible la escena» activado. El fondo ya viene transparente."
				divider={false}
				actions={<ThemeMenu />}
			/>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
				<TokenCard token={token} onRotated={setToken} />
				<TestAlertsCard />
			</div>

			<Tabs
				items={[
					{ id: "pieces", label: "Piezas", count: pieces.length },
					{ id: "scenes", label: "Escenas", count: scenes.length },
				]}
				value={tab}
				onChange={pickTab}
				type="underline"
				size="md"
				aria-label="Fuentes de navegador"
			/>

			<div className="flex flex-col gap-4">
				{tab === "scenes" ? (
					<>
						<div className="w-60 max-w-full">
							<Select
								label="Lienzo"
								size="sm"
								value={canvasId}
								onChange={pickCanvas}
								options={CANVAS_IDS.map((id) => ({
									value: id,
									label: canvasLabel(canvasById(id)),
								}))}
							/>
						</div>
						{scenes}
					</>
				) : (
					pieces
				)}
			</div>
		</div>
	);
}
