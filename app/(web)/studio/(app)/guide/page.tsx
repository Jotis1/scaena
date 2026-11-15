import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsNotice } from "@/components/studio/EventsNotice";
import { GuideBody } from "@/components/studio/guide/GuideBody";
import { canvasOf } from "@/lib/overlay/canvas";
import { requirePageSession } from "@/lib/studio/session";

export const metadata: Metadata = { title: "Guía de uso · Estudio · Scaena", robots: { index: false } };
export const dynamic = "force-dynamic";

// Estudio · Guía de uso (specs/obs-overlays, «Guía de montaje en OBS» y «Máscara de la cámara»). Aquí solo se lee el
// lienzo inicial de `?canvas=`; el resto lo pinta `GuideBody`, en el cliente, para que cambiar de lienzo no espere al
// servidor.
export default async function GuidePage({ searchParams }: { searchParams: Promise<{ canvas?: string }> }) {
	const session = await requirePageSession();
	const canvas = canvasOf(await searchParams);
	return (
		<>
			<Suspense fallback={null}>
				<EventsNotice channelId={session.channelId} />
			</Suspense>
			<GuideBody initial={canvas.id} />
		</>
	);
}
