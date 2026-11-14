import { Alert, Button, PageHeader, SectionHeader, Table } from "@jotis-me/react";
import { Download01, InfoCircle } from "@untitledui/icons";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuideCanvasPicker } from "@/components/studio/guide/GuideCanvasPicker";
import { ThemeMenu } from "@/components/web/ThemeMenu";
import { type Canvas, canvasLabel, canvasOf } from "@/lib/overlay/canvas";
import { type GuideScene, guideLayers, MASK_HREF, position, size } from "@/lib/studio/obs-guide";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Guía de OBS · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Guía de OBS (specs/obs-overlays, «Guía de montaje en OBS» y «Máscara de la cámara»). Las medidas
// salen de las mismas cajas que colocan las escenas (design.md, decisión 1).
export default async function GuidePage({ searchParams }: { searchParams: Promise<{ canvas?: string }> }) {
	await requirePageSession();
	const canvas = canvasOf(await searchParams);
	const label = canvasLabel(canvas);
	return (
		<div className="flex flex-col gap-10">
			<PageHeader
				title="Guía de OBS"
				description={`Dónde va cada fuente y a qué tamaño, en píxeles de un lienzo de ${label}. En OBS, el lienzo base se elige en Ajustes › Vídeo.`}
				divider={false}
				actions={<ThemeMenu />}
			/>
			<GuideCanvasPicker canvas={canvas.id} />

			<GuideSection
				id="game"
				title="Escena de juego"
				sources="Fuentes de la escena de juego"
				description="Tres fuentes, de arriba abajo. La escena de Scaena va encima de todo: el marco de la cámara y las piezas pisan la cámara y el juego."
				scene="game"
				canvas={canvas}
			>
				<CameraMask />
			</GuideSection>

			<GuideSection
				id="chatting"
				title="Just Chatting"
				sources="Fuentes de Just Chatting"
				description="Dos fuentes. La cámara va debajo de la escena, que tiene un hueco con las esquinas redondeadas en su sitio."
				scene="chatting"
				canvas={canvas}
			>
				<Alert
					color="gray"
					icon={InfoCircle}
					title="Aquí no hace falta máscara"
					description="El fondo de la escena tapa las esquinas de la cámara. Basta con ponerla en su sitio y a su tamaño."
				/>
			</GuideSection>

			<GuideSection
				id="fullscreen"
				title="Escenas de pantalla completa"
				sources="Fuentes de las escenas de pantalla completa"
				description="Empezando, vuelvo enseguida, final y offline: una sola fuente que ocupa todo el lienzo, sin nada debajo."
				scene="fullscreen"
				canvas={canvas}
			/>

			<section aria-labelledby="browser-source" className="flex flex-col gap-4">
				<SectionHeader title={<span id="browser-source">Ajustes de la fuente de navegador</span>} />
				<ul className="flex list-disc flex-col gap-2 pl-5 text-md text-secondary">
					<li>
						Ancho y alto: los del lienzo,{" "}
						<strong className="font-semibold text-primary">{label}</strong>. En las escenas, la
						URL tiene que ser la del mismo lienzo (el selector de Overlays › Escenas).
					</li>
					<li>Activa «Actualizar el navegador cuando la escena se active».</li>
					<li>Deja el CSS personalizado como viene: el fondo ya es transparente.</li>
					<li>
						Si cambias la meta, no hay que tocar nada en OBS: se edita en Overlays › Piezas › Meta
						y llega en directo.
					</li>
				</ul>
			</section>
		</div>
	);
}

function GuideSection({
	id,
	title,
	sources,
	description,
	scene,
	canvas,
	children,
}: {
	id: GuideScene;
	title: string;
	/** Nombre de la tabla: único en la página, porque es una región. */
	sources: string;
	description: string;
	scene: GuideScene;
	canvas: Canvas;
	children?: ReactNode;
}) {
	// La página es de servidor y `Table`, de cliente: las celdas van ya pintadas, sin `render`.
	return (
		<section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-8 flex-col gap-4">
			<SectionHeader title={<span id={`${id}-title`}>{title}</span>} description={description} />
			<Table
				title={sources}
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
							<span>{l.name}</span>
							<span className="text-sm font-normal text-tertiary">{l.from}</span>
						</span>
					),
					source: l.source,
					position: <span className="tabular-nums">{position(l.box)}</span>,
					size: <span className="tabular-nums">{size(l.box)}</span>,
				}))}
			/>
			{children}
		</section>
	);
}

function CameraMask() {
	return (
		<div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
			<div className="flex flex-wrap items-start gap-4">
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h3 className="text-md font-semibold text-primary">
						Que la cámara no asome por las esquinas
					</h3>
					<p className="text-sm text-tertiary">
						La cámara de OBS es un rectángulo y el marco tiene las esquinas redondeadas. Con esta
						máscara, la cámara toma la misma forma. Vale para cualquier cámara 16:9 y para los dos
						lienzos.
					</p>
				</div>
				<Button href={MASK_HREF} download hierarchy="secondary" size="md" iconLeading={Download01}>
					Descargar máscara
				</Button>
			</div>
			<ol className="flex list-decimal flex-col gap-2 pl-5 text-md text-secondary">
				<li>En OBS, clic derecho en la fuente de la cámara › Filtros.</li>
				<li>
					En «Filtros de efectos», añade «Máscara de imagen/mezcla» (en inglés, «Image Mask/Blend»).
				</li>
				<li>Tipo: «Máscara alfa (canal alfa)». Ruta: la máscara que has descargado.</li>
				<li>
					Clic derecho en la cámara › Transformar › Editar transformación, y pon la posición y el
					tamaño de la tabla, con la alineación arriba a la izquierda.
				</li>
			</ol>
			<Alert
				color="warning"
				title="Sin recortar la cámara"
				description="Si recortas la cámara deja de ser 16:9 y la máscara se deforma. Para encuadrar, usa los ajustes de la propia cámara."
			/>
		</div>
	);
}
