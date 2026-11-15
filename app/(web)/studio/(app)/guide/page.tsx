import { Alert, Button, Table, Tabs, TransparencyGrid } from "@jotis-me/react";
import { Download01, InfoCircle } from "@untitledui/icons";
import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { EventsNotice } from "@/components/studio/EventsNotice";
import { GuideCanvasPicker } from "@/components/studio/guide/GuideCanvasPicker";
import { StudioContent, StudioPageHeader } from "@/components/studio/StudioContent";
import { type Canvas, canvasLabel, canvasOf } from "@/lib/overlay/canvas";
import {
	cameraDiagram,
	type GuideScene,
	guideLayers,
	MASK_HREF,
	position,
	size,
} from "@/lib/studio/obs-guide";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Guía de OBS · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Guía de OBS (diseño: «Guía de OBS»; specs/obs-overlays, «Guía de montaje en OBS» y «Máscara de la
// cámara»). Las medidas y los esquemas salen de las mismas cajas que colocan las escenas (`boxes.ts`).
export default async function GuidePage({ searchParams }: { searchParams: Promise<{ canvas?: string }> }) {
	const session = await requirePageSession();
	const canvas = canvasOf(await searchParams);
	const label = canvasLabel(canvas);
	return (
		<>
			<Suspense fallback={null}>
				<EventsNotice channelId={session.channelId} />
			</Suspense>
			<StudioContent gap="gap-10">
				<div className="flex flex-col gap-5">
					<StudioPageHeader
						title="Guía de OBS"
						description="Dónde va cada fuente y a qué tamaño, en píxeles del lienzo que elijas. En OBS, el lienzo base está en Ajustes › Vídeo."
						aside={<GuideCanvasPicker canvas={canvas.id} />}
					/>
					<div className="overflow-x-auto">
						<Tabs
							type="button-gray"
							size="sm"
							aria-label="En esta guía"
							items={[
								{ id: "game", label: "Escena de juego", href: "#game" },
								{ id: "chatting", label: "Just Chatting", href: "#chatting" },
								{ id: "fullscreen", label: "Pantalla completa", href: "#fullscreen" },
								{ id: "browser", label: "Fuente de navegador", href: "#browser" },
							]}
						/>
					</div>
				</div>

				<GuideSection
					id="game"
					title="Escena de juego"
					description="Tres fuentes, de arriba abajo, como en la lista de OBS. La escena de Scaena va encima de todo: su marco y sus piezas pisan la cámara y el juego."
				>
					<Layers
						scene="game"
						canvas={canvas}
						sources="Fuentes de la escena de juego"
						caption="El lienzo, a escala. La línea discontinua es la escena de Scaena, que lo ocupa entero."
					/>
					<CameraMask />
				</GuideSection>

				<GuideSection
					id="chatting"
					title="Just Chatting"
					description="Dos fuentes. La cámara va debajo de la escena, que tiene un hueco con las esquinas redondeadas justo en su sitio."
				>
					<Layers
						scene="chatting"
						canvas={canvas}
						sources="Fuentes de Just Chatting"
						caption="La cámara, en grande y a la izquierda. El resto lo pone la escena."
					>
						<Alert
							color="gray"
							icon={InfoCircle}
							title="Aquí no hace falta máscara"
							description="El fondo de la escena tapa las esquinas de la cámara. Basta con ponerla en su sitio y a su tamaño."
						/>
					</Layers>
				</GuideSection>

				<GuideSection
					id="fullscreen"
					title="Escenas de pantalla completa"
					description="Empezando, vuelvo enseguida, final y offline: una sola fuente que ocupa todo el lienzo, sin nada debajo. La más fácil de las tres."
				>
					<div className="overflow-x-auto">
						<SourcesTable
							scene="fullscreen"
							canvas={canvas}
							title="Fuentes de las escenas de pantalla completa"
						/>
					</div>
				</GuideSection>

				<GuideSection
					id="browser"
					title="Ajustes de la fuente de navegador"
					description="Lo mismo para todas las fuentes de Scaena."
				>
					<div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
						<SettingCard title="Ancho y alto">
							Los del lienzo: <strong className="font-semibold text-primary">{label}</strong>.
							En las escenas, la URL tiene que ser la del mismo lienzo (se elige en Overlays ›
							Escenas).
						</SettingCard>
						<SettingCard title="Actualizar al activar la escena">
							Marca «Actualizar el navegador cuando la escena se active». Así la cuenta atrás
							empieza de cero cada vez.
						</SettingCard>
						<SettingCard title="CSS personalizado">
							Déjalo como viene. El fondo ya es transparente y no hay nada que arreglar.
						</SettingCard>
						<SettingCard title="Cambiar la meta">
							No se toca nada en OBS: se edita en{" "}
							<a
								href="/studio/overlays?source=goal"
								className="rounded-sm font-semibold text-brand-secondary focus-visible:shadow-focus-ring focus-visible:outline-none"
							>
								Overlays › Piezas › Meta
							</a>{" "}
							y llega en directo.
						</SettingCard>
					</div>
				</GuideSection>
			</StudioContent>
		</>
	);
}

function GuideSection({
	id,
	title,
	description,
	children,
}: {
	id: string;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-8 flex-col gap-5">
			<div className="flex flex-col gap-1">
				<h2 id={`${id}-title`} className="text-xl font-semibold text-primary">
					{title}
				</h2>
				<p className="max-w-180 text-sm text-tertiary">{description}</p>
			</div>
			{children}
		</section>
	);
}

/** Esquema a escala y tabla de fuentes de una escena montada, uno al lado del otro. */
function Layers({
	scene,
	canvas,
	sources,
	caption,
	children,
}: {
	scene: "game" | "chatting";
	canvas: Canvas;
	sources: string;
	caption: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-start gap-x-8 gap-y-6">
			<figure className="m-0 flex min-w-0 flex-[1_1_320px] flex-col gap-2">
				<Diagram scene={scene} canvas={canvas} />
				<figcaption className="text-xs text-tertiary">{caption}</figcaption>
			</figure>
			<div className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
				<div className="overflow-x-auto">
					<SourcesTable scene={scene} canvas={canvas} title={sources} />
				</div>
				{children}
			</div>
		</div>
	);
}

/**
 * El lienzo a escala con sus capas (diseño: «Guía de OBS»): la cámara donde va de verdad, sacada de `boxes.ts`
 * (`cameraDiagram`), y la línea discontinua de la escena de Scaena, que ocupa todo el lienzo.
 */
function Diagram({ scene, canvas }: { scene: "game" | "chatting"; canvas: Canvas }) {
	const cam = cameraDiagram(scene, canvas);
	return (
		<div
			className="relative overflow-hidden rounded-xl border border-secondary bg-secondary"
			style={{ aspectRatio: `${canvas.width} / 1080` }}
			data-diagram={scene}
		>
			{scene === "game" ? (
				<div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-tertiary">
					3 - Juego
				</div>
			) : null}
			<div
				className="absolute flex items-center justify-center rounded-md bg-quaternary text-xs font-semibold text-primary"
				style={{
					left: `${cam.x}%`,
					top: `${cam.y}%`,
					width: `${cam.width}%`,
					height: `${cam.height}%`,
				}}
				data-diagram-camera
			>
				2 - Cámara
			</div>
			<div className="absolute inset-1.5 rounded-lg border-2 border-dashed border-brand" />
			<div
				className={`absolute top-3 text-xs font-semibold text-brand-secondary ${scene === "game" ? "left-3.5" : "right-3.5"}`}
			>
				1 - Escena de Scaena
			</div>
		</div>
	);
}

/** Tabla de fuentes. La página es de servidor y `Table`, de cliente: las celdas van ya pintadas, sin `render`. */
function SourcesTable({ scene, canvas, title }: { scene: GuideScene; canvas: Canvas; title: string }) {
	return (
		<Table
			size="sm"
			title={title}
			description="De arriba abajo, como en la lista de fuentes de OBS."
			columns={[
				{ key: "layer", label: "Capa", align: "right" },
				{ key: "name", label: "Fuente", primary: true },
				{ key: "source", label: "Tipo en OBS" },
				{ key: "position", label: "Posición" },
				{ key: "size", label: "Tamaño" },
			]}
			rows={guideLayers(scene, canvas).map((l, i) => ({
				id: l.name,
				layer: i + 1,
				name: (
					<span className="flex flex-col">
						<span className="font-medium text-primary">{l.name}</span>
						<span className="font-normal text-tertiary">{l.from}</span>
					</span>
				),
				source: l.source,
				position: <span className="tabular-nums">{position(l.box)}</span>,
				size: <span className="tabular-nums">{size(l.box)}</span>,
			}))}
		/>
	);
}

function CameraMask() {
	return (
		<div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
			<div className="flex flex-wrap items-start gap-x-6 gap-y-4">
				<div
					aria-hidden="true"
					className="relative h-18 w-32 flex-none overflow-hidden rounded-lg border border-secondary"
				>
					<TransparencyGrid size="sm" className="absolute inset-0" />
					{/* color-fijo: es la muestra de la máscara, blanca como el PNG; no es interfaz. */}
					<div className="absolute inset-0 rounded-xl bg-[#ffffff]" />
				</div>
				<div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
					<h3 className="text-md font-semibold text-primary">Máscara de la cámara</h3>
					<p className="max-w-180 text-sm text-tertiary">
						La cámara de OBS es un rectángulo y el marco tiene las esquinas redondeadas. Con esta
						máscara, la cámara toma la misma forma y no asoma por las esquinas. Vale para
						cualquier cámara 16:9 y para los dos lienzos.
					</p>
				</div>
				<Button href={MASK_HREF} download hierarchy="secondary" size="md" iconLeading={Download01}>
					Descargar máscara
				</Button>
			</div>
			<ol className="flex flex-col gap-3">
				{[
					"En OBS, clic derecho en la fuente de la cámara › Filtros.",
					"En «Filtros de efectos», añade «Máscara de imagen/mezcla» (en inglés, «Image Mask/Blend»).",
					"Tipo: «Máscara alfa (canal alfa)». Ruta: la máscara que has descargado.",
					"Clic derecho en la cámara › Transformar › Editar transformación, y pon la posición y el tamaño de la tabla, con la alineación arriba a la izquierda.",
				].map((step, i) => (
					<li key={step} className="flex gap-3 text-md text-secondary">
						<span
							aria-hidden="true"
							className="w-6 flex-none font-semibold text-primary tabular-nums"
						>
							{i + 1}.
						</span>
						<span>{step}</span>
					</li>
				))}
			</ol>
			<Alert
				color="warning"
				title="No recortes la cámara"
				description="Si la recortas deja de ser 16:9 y la máscara se deforma. Para encuadrar, usa los ajustes de la propia cámara."
			/>
		</div>
	);
}

function SettingCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-1 rounded-xl border border-secondary p-5">
			<h3 className="text-sm font-semibold text-primary">{title}</h3>
			<p className="text-sm text-tertiary">{children}</p>
		</div>
	);
}
