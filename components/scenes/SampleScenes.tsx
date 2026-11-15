"use client";

import {
	CamFrame,
	ChatBox,
	ScaledPreview,
	StreamAlert,
	StreamEvents,
	StreamGoal,
	StreamStatus,
} from "@jotis-me/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CAMERA_HOLE, ChattingLayout, GameLayout } from "@/components/overlay/scenes/layouts";
import { SAMPLE_CHAT, SAMPLE_EVENTS } from "@/components/studio/samples";
import { GOAL_LABELS, GOAL_UNITS } from "@/lib/alerts/goal";

// Escenas montadas con datos de muestra (diseño: «Escenas montadas»), para enseñarlas fuera de OBS: el marco y
// «Cómo va un directo» de la portada. Son ilustración: van ocultas al lector de pantalla y sin foco.

export interface SampleSceneProps {
	/** Nombre del marco de cámara (perfil, `camera.name`). */
	cameraName: string;
	/** La frase de la alerta de muestra, ya rellena. */
	alertDetail: string;
}

/** La escena de juego, con una raid, la meta, el chat, los eventos y la cámara (diseño: «Juego»). */
export function SampleGameScene({ cameraName, alertDetail }: SampleSceneProps) {
	return (
		<GameLayout
			status={<StreamStatus status="live" uptime="2:14:05" category="Elden Ring" />}
			alerts={<StreamAlert type="raid" user="[canal]" amount={1284} detail={alertDetail} />}
			goal={
				<StreamGoal
					label={GOAL_LABELS.subs}
					current={284}
					goal={300}
					unit={GOAL_UNITS.subs}
					width={400}
				/>
			}
			chat={<ChatBox messages={SAMPLE_CHAT} width={400} height={440} translucent />}
			events={<StreamEvents items={SAMPLE_EVENTS} max={4} width={384} />}
			camera={<CamFrame ratio="16:9" width={384} live name={cameraName} />}
		/>
	);
}

/** La escena de Just Chatting: la cámara grande, el chat al lado, y la meta y los eventos debajo. */
export function SampleChattingScene({ cameraName, alertDetail }: SampleSceneProps) {
	return (
		<ChattingLayout
			status={<StreamStatus status="live" uptime="2:14:05" category="Just Chatting" />}
			alerts={<StreamAlert type="resub" user="[espectador]" months={14} detail={alertDetail} />}
			goal={
				<StreamGoal
					label={GOAL_LABELS.subs}
					current={284}
					goal={300}
					unit={GOAL_UNITS.subs}
					width={400}
				/>
			}
			events={<StreamEvents items={SAMPLE_EVENTS} max={2} width={400} />}
			camera={<CamFrame ratio="16:9" width={CAMERA_HOLE.width} live name={cameraName} />}
			chat={<ChatBox messages={SAMPLE_CHAT} width={528} height={736} />}
		/>
	);
}

/**
 * Una escena de 1920×1080 encogida al ancho de su contenedor, en 16:9. Mide el contenedor, así que a 390 px cabe sin
 * desplazamiento; hasta medir, usa `initialWidth`. Va con `aria-hidden` e `inert`: es una muestra.
 */
export function FitScene({ initialWidth, children }: { initialWidth: number; children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(initialWidth);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const update = () => setWidth(Math.max(1, Math.floor(el.clientWidth)));
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);
	return (
		<div ref={ref} aria-hidden="true" inert className="w-full">
			<ScaledPreview width={1920} box={[width, Math.round((width * 9) / 16)]}>
				<div className="h-270 w-480">{children}</div>
			</ScaledPreview>
		</div>
	);
}
