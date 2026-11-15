import { channelIdOf } from "@/lib/channel";
import { baseProfileOf, profileStore } from "@/lib/profile";
import { clearProfileEdits, type ProfileEditDeps, saveProfileEdits } from "@/lib/studio/profile-edits";
import { requireApiSession } from "@/lib/studio/session";

// Cambios del perfil del canal de la sesión desde Recursos (design.md del cambio multi-channel-studio, decisión 5).
// `PUT { edits }` valida y guarda; `DELETE` vuelve a los valores por defecto de su canal.
async function deps(session: { channelId: string; login: string }): Promise<ProfileEditDeps | null> {
	const base = await baseProfileOf(session.login);
	if (!base) return null;
	return {
		sessionChannelId: session.channelId,
		profileChannelId: () => channelIdOf(base.twitch.login),
		base,
		store: await profileStore(),
	};
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
	const d = await deps(session);
	if (!d) return Response.json({ error: "Tu canal no tiene perfil." }, { status: 404 });
	const r = await saveProfileEdits(d, body);
	return Response.json(r.body, { status: r.status });
}

export async function DELETE(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	const d = await deps(session);
	if (!d) return Response.json({ error: "Tu canal no tiene perfil." }, { status: 404 });
	const r = await clearProfileEdits(d);
	return Response.json(r.body, { status: r.status });
}
