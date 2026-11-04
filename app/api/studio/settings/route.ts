import { effectivePhrases, readSettings, SettingsError, saveSettings } from "@/lib/alerts/settings";
import { getMainProfile } from "@/lib/profile";
import { store } from "@/lib/storage/redis";
import { requireApiSession } from "@/lib/studio/session";

// Frases de alerta del canal de la sesión (design.md, decisión 9).
export async function GET(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	const settings = await readSettings(store(), session.channelId);
	return Response.json({ alerts: effectivePhrases(getMainProfile(), settings), saved: settings.alerts });
}

export async function PUT(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "El cuerpo tiene que ser JSON." }, { status: 400 });
	}
	try {
		const alerts = await saveSettings(store(), session.channelId, getMainProfile(), body);
		return Response.json({ alerts });
	} catch (e) {
		if (e instanceof SettingsError)
			return Response.json({ error: e.message, fields: e.fields }, { status: 400 });
		throw e;
	}
}
