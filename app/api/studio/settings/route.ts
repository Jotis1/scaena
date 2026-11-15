import { readGoal, saveGoal } from "@/lib/alerts/saved-goal";
import { effectivePhrases, readSettings, SettingsError, saveSettings } from "@/lib/alerts/settings";
import { loadMainProfile } from "@/lib/profile";
import { store } from "@/lib/storage/redis";
import { requireApiSession } from "@/lib/studio/session";

// Frases de alerta y meta guardada del canal de la sesión (design.md, decisión 9; specs/obs-overlays, «Meta editable
// en el estudio»). Un `PUT` con `goal` guarda la meta; uno con `alerts`, las frases.
export async function GET(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	const s = store();
	const [settings, goal] = await Promise.all([
		readSettings(s, session.channelId),
		readGoal(s, session.channelId),
	]);
	return Response.json({
		alerts: effectivePhrases(await loadMainProfile(), settings),
		saved: settings.alerts,
		goal,
	});
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
		if (body && typeof body === "object" && "goal" in body)
			return Response.json({ goal: await saveGoal(store(), session.channelId, body) });
		const alerts = await saveSettings(store(), session.channelId, await loadMainProfile(), body);
		return Response.json({ alerts });
	} catch (e) {
		if (e instanceof SettingsError)
			return Response.json({ error: e.message, fields: e.fields }, { status: 400 });
		throw e;
	}
}
