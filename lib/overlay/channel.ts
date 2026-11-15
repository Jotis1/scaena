// Canal de un overlay a partir de la URL (`/overlay/<canal>/…`). Un canal sin perfil da 404, no un 500.
import { notFound } from "next/navigation";
import { findProfile, type Profile } from "../profile";

export async function profileForOverlay(channel: string): Promise<Profile> {
	const profile = await findProfile(decodeURIComponent(channel));
	if (!profile) notFound();
	return profile;
}
