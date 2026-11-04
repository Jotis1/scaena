import { store } from "@/lib/storage/redis";
import { requireApiSession } from "@/lib/studio/session";
import { sendTestAlert } from "@/lib/studio/test-alerts";

// «Alertas de prueba» del estudio: `{ "type": "raid" }` → un evento de prueba en el stream del canal.
export async function POST(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	let type: unknown;
	try {
		type = ((await request.json()) as { type?: unknown }).type;
	} catch {}
	const event = await sendTestAlert(store(), session.channelId, String(type ?? ""));
	if (!event)
		return Response.json(
			{ error: "Tipo de alerta desconocido. Usa follow, sub, resub, gift, raid o bits." },
			{ status: 400 },
		);
	return Response.json({ event });
}
