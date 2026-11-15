// Canal de un overlay a partir de la URL (`/overlay/<canal>/…`). Un canal sin perfil da 404, no un 500.
import { notFound } from "next/navigation";
import { loadProfile, type Profile, repoProfileOf } from "../profile";

export async function profileForOverlay(channel: string): Promise<Profile> {
	const login = decodeURIComponent(channel);
	try {
		repoProfileOf(login);
	} catch {
		notFound();
	}
	return loadProfile(login);
}
