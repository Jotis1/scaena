// Canal de un overlay a partir de la URL (`/overlay/<canal>/…`). Un canal sin perfil da 404, no un 500.
import { notFound } from "next/navigation";
import { getProfile, type Profile } from "../profile";

export function profileForOverlay(channel: string): Profile {
	try {
		return getProfile(decodeURIComponent(channel));
	} catch {
		notFound();
	}
}
