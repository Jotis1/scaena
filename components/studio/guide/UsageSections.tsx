import { Alert } from "@jotis-me/react";
import { InfoCircle } from "@untitledui/icons";
import type { ReactNode } from "react";

// Secciones de la «Guía de uso» que no dependen del lienzo (specs/obs-overlays, «Cómo funciona y pasos a mano» y
// «Trucos de OBS»). Texto con la voz de la suite: dice qué pasa y qué hacer, sin bromas.

const LINK =
	"rounded-sm font-semibold text-brand-secondary focus-visible:shadow-focus-ring focus-visible:outline-none";

function Section({
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

function Steps({ items }: { items: ReactNode[] }) {
	return (
		<ol className="flex max-w-180 flex-col gap-3">
			{items.map((step, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: la lista es fija y no cambia de orden.
				<li key={i} className="flex gap-3 text-md text-secondary">
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
	);
}

function Card({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-1 rounded-xl border border-secondary p-5">
			<h3 className="text-sm font-semibold text-primary">{title}</h3>
			<p className="text-sm text-tertiary">{children}</p>
		</div>
	);
}

export function HowItWorks() {
	return (
		<Section
			id="how"
			title="Cómo funciona"
			description="Twitch avisa a Scaena de lo que pasa en el canal y Scaena se lo pasa en vivo a las fuentes de OBS. En OBS solo hay fuentes de navegador con una URL."
		>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
				<Card title="1. De Twitch a Scaena">
					Con los eventos conectados, Twitch avisa al momento de cada follow, sub, renovación,
					regalo, raid, bits y meta, y de cuándo empieza y acaba el directo.
				</Card>
				<Card title="2. De Scaena a OBS">
					Cada fuente de navegador está conectada a Scaena y pinta lo que llega: la alerta, los
					eventos, la meta, el estado y el chat, que se lee directamente de Twitch.
				</Card>
				<Card title="3. El token">
					Las URL de alertas, eventos, meta y escenas llevan un token secreto. Sin él, la fuente no
					recibe nada. Si se filtra, rótalo en Overlays y vuelve a pegar las URL.
				</Card>
				<Card title="4. Qué meta sale">
					Puedes tener hasta 5 metas de Scaena, y cada una cuenta aunque no salga. En la meta de
					Overlays eliges cuál sale en la pieza y en las escenas: una tuya, una activa en Twitch o
					«Rotar», que va pasando por las que marques cada 10, 20 o 30 segundos, todas las fuentes a
					la vez. Si no eliges nada, sale la primera de las tuyas.
				</Card>
			</div>
			<Alert
				color="gray"
				icon={InfoCircle}
				title="Lo que va solo"
				description="Las alertas, los eventos, la meta, el estado del directo y el chat no se tocan en OBS. Las frases, la meta y el contenido de los paneles se cambian aquí, en el estudio, y llegan sin recargar."
			/>
		</Section>
	);
}

export function ManualSteps() {
	return (
		<Section
			id="manual"
			title="Lo que hay que hacer a mano"
			description="Una vez, al montar el directo. Después ya no hay que volver a OBS salvo que cambies de lienzo o rotes el token."
		>
			<Steps
				items={[
					<>
						Entra en el estudio con Twitch y pulsa «Conectar eventos» en{" "}
						<a href="/studio/connection" className={LINK}>
							Conexión
						</a>
						. Si Scaena pide un permiso nuevo, vuelve a entrar.
					</>,
					"En OBS, pon el lienzo base en Ajustes › Vídeo: 1920 × 1080 o 3440 × 1440, el mismo que elijas arriba.",
					"Añade cada URL de Overlays como fuente de navegador, con el ancho y el alto de su tabla.",
					"En la escena de juego, aplica la máscara a la cámara para que no asome por las esquinas.",
					"Si quieres usar una meta de Twitch, créala en el panel de creador de Twitch y elígela en «Qué meta sale», en la meta de Overlays. Cuando termina en Twitch, vuelve a salir tu primera meta de Scaena.",
					"Si rotas el token, vuelve a copiar y pegar las URL que lo llevan.",
				]}
			/>
		</Section>
	);
}

export function ObsTricks() {
	return (
		<Section
			id="tricks"
			title="Trucos de OBS"
			description="Montajes que no son evidentes y que ahorran rehacer escenas."
		>
			<div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
				<div className="flex flex-col gap-1">
					<h3 className="text-md font-semibold text-primary">
						La cámara con un filtro en una escena y sin él en otra
					</h3>
					<p className="max-w-180 text-sm text-tertiary">
						La fuente de la cámara es la misma en todas las escenas: un filtro puesto en ella
						cambia la cámara en todas. Para que solo cambie en una, el filtro va en un grupo.
					</p>
				</div>
				<Steps
					items={[
						"Crea una escena nueva, por ejemplo «Cámara», y añade dentro la fuente de la cámara.",
						"En la escena donde la quieres con filtro, añade la escena «Cámara» como fuente (Añadir › Escena).",
						"Clic derecho en esa fuente › Agrupar los elementos seleccionados, y ponle un nombre al grupo.",
						"Clic derecho en el grupo › Filtros, y añade ahí el filtro. En las demás escenas, la cámara sigue sin él.",
					]}
				/>
			</div>
		</Section>
	);
}
