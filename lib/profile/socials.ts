// Redes del perfil. Una red sin enlace no se muestra en ningún sitio (specs/channel-profile, «Enlaces opcionales»).
import type { Profile } from "./schema";

export type Network = Profile["socials"][number]["network"];

export const SOCIAL_NAMES: Record<Network, string> = {
	twitch: "Twitch",
	youtube: "YouTube",
	discord: "Discord",
};

export type LinkedSocial = Profile["socials"][number] & { url: string };

export function linkedSocials(p: Profile): LinkedSocial[] {
	return p.socials.filter((s): s is LinkedSocial => Boolean(s.url));
}

/** Lo que se ve junto al nombre: `twitch.tv/jotis1`, `@jotis_1` o la invitación. */
export function socialHandle(p: Profile, s: LinkedSocial): string {
	if (s.network === "twitch") return `twitch.tv/${p.twitch.login}`;
	if (s.network === "youtube") return p.youtube.handle;
	return s.url.replace(/^https?:\/\/(www\.)?/, "");
}
