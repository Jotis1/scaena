import { channelIdOf } from "@/lib/channel";
import { profileStore, repoProfile } from "@/lib/profile";
import { clearProfileEdits, type ProfileEditDeps, saveProfileEdits } from "@/lib/studio/profile-edits";
import { requireApiSession } from "@/lib/studio/session";

// Cambios del perfil del canal desde Recursos (design.md del cambio studio-sidebar-twitch-goals-editable-profile,
// decisión 8). `PUT { edits }` valida y guarda; `DELETE` vuelve al perfil del repositorio.
async function deps(channelId: string): Promise<ProfileEditDeps> {
	const base = repoProfile();
	return {
		sessionChannelId: channelId,
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
	const r = await saveProfileEdits(await deps(session.channelId), body);
	return Response.json(r.body, { status: r.status });
}

export async function DELETE(request: Request) {
	const session = await requireApiSession(request);
	if (session instanceof Response) return session;
	const r = await clearProfileEdits(await deps(session.channelId));
	return Response.json(r.body, { status: r.status });
}
