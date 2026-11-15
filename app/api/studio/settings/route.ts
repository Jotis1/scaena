import { effectivePhrases, readSettings, SettingsError, saveSettings } from "@/lib/alerts/settings";
import { loadProfile } from "@/lib/profile";
import { store } from "@/lib/storage/redis";
import { deleteGoalRequest, putGoals, readGoalPanel } from "@/lib/studio/goal-settings";
import { requireApiSession } from "@/lib/studio/session";

// Frases de alerta y metas del canal de la sesión (design.md, decisión 9; specs/obs-overlays, «Meta editable en el
// estudio» y «Qué meta sale»; design.md del cambio goal-selector-and-rotation, decisión 8). Un `PUT` con `goal`,
// `show` o `dismissEnded` es de las metas (`lib/studio/goal-settings.ts`); uno con `alerts`, de las frases.
export async function GET(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	const s = store();
	const [settings, goals] = await Promise.all([
		readSettings(s, session.channelId),
		readGoalPanel(s, session.channelId),
	]);
	return Response.json({
		alerts: effectivePhrases(await loadProfile(session.login), settings),
		saved: settings.alerts,
		...goals,
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
	const goals = await putGoals(store(), session.channelId, body);
	if (goals) return Response.json(goals.body, { status: goals.status });
	try {
		const alerts = await saveSettings(store(), session.channelId, await loadProfile(session.login), body);
		return Response.json({ alerts });
	} catch (e) {
		if (e instanceof SettingsError)
			return Response.json({ error: e.message, fields: e.fields }, { status: 400 });
		throw e;
	}
}

export async function DELETE(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	const r = await deleteGoalRequest(store(), session.channelId, new URL(request.url));
	return Response.json(r.body, { status: r.status });
}
