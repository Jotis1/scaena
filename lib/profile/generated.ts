// Perfil de un canal añadido desde «Cuentas» (specs/channel-profile, «Perfil de un canal añadido»; design.md del
// cambio multi-channel-studio, decisión 3). Empieza con lo de su Twitch (nombre y descripción) y Twitch como única
// red; normas, qué se emite y días del horario, vacíos para rellenarlos en Recursos. Los paneles son los que salen de
// sus propios datos («De qué va», «Horario», «Normas» y «Redes»): los de «Normas» y «Redes» no se ven hasta que tenga
// normas o una red además de Twitch. Los textos de escenas, alertas y cámara son genéricos, con su nombre donde toca.
// Lo de la web (portada, pasos, pie) no se ve: no tiene.
import type { StudioChannelRow } from "../studio/channels";
import { type Profile, profileSchema } from "./schema";

/** Emojis y pictogramas fuera: el perfil no los admite y las descripciones de Twitch suelen llevarlos. */
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;
const clean = (s: string) =>
	s
		.replace(EMOJI, "")
		.replace(/\s+/g, " ")
		// Sin espacio delante de un signo, que es lo que queda al quitar un emoji: «Pinto 🎨.» → «Pinto.».
		.replace(/\s+([.,;:!?])/g, "$1")
		.trim();

/** Las frases de la descripción de Twitch, como mucho cuatro. */
function sentences(description: string): string[] {
	const text = clean(description);
	if (!text) return [];
	const parts = text
		.match(/[^.!?]+[.!?]*/g)
		?.map((s) => s.trim())
		.filter(Boolean) ?? [text];
	return parts.slice(0, 4);
}

export function generatedProfile(row: Pick<StudioChannelRow, "login" | "name" | "description">): Profile {
	const login = row.login.toLowerCase();
	const name = clean(row.name) || login;
	const description = sentences(row.description);
	const fallback = `Canal de ${name} en Twitch.`;
	return profileSchema.parse({
		name,
		twitch: { login },
		tagline: description[0] ?? fallback,
		description: description.length ? description : [fallback],
		site: { intro: fallback, footer: fallback },
		journey: {
			before: { title: "Antes", heading: "Aviso", text: "Twitch avisa al empezar.", where: "twitch" },
			game: {
				title: "La partida",
				heading: "La partida",
				text: "En directo en Twitch.",
				where: "twitch",
			},
			chatting: {
				title: "La charla",
				heading: "La charla",
				text: "En directo en Twitch.",
				where: "twitch",
			},
			after: {
				title: "Después",
				heading: "Después",
				text: "Hasta el próximo directo.",
				where: "twitch",
			},
		},
		// Sin días, el horario sale como «Sin fijar» hasta que se rellene.
		schedule: { start: "18:00", end: "21:00", zone: "Hora peninsular" },
		streams: [],
		banner: { eyebrow: "En directo en Twitch" },
		socials: [
			{ network: "twitch", text: "El directo, cuando lo hay.", url: `https://twitch.tv/${login}` },
		],
		rules: [],
		panels: [
			{ slug: "de-que-va", title: "De qué va", icon: "info-circle", from: "description" },
			{
				slug: "horario",
				title: "Horario",
				icon: "clock",
				paragraphs: ["Lo habitual, no una cita."],
				rows: "schedule",
			},
			{ slug: "normas", title: "Normas", icon: "shield-tick", from: "rules" },
			{
				slug: "redes",
				title: "Redes",
				icon: "link-01",
				paragraphs: ["Para lo que pasa fuera del directo."],
				rows: "socials",
			},
		],
		scenes: {
			starting: { badge: "Empezamos pronto", title: "Ya casi", subtitle: "Unos minutos y empezamos." },
			brb: { badge: "Pausa", title: "Vuelvo enseguida", subtitle: "Un momento y seguimos." },
			ending: { badge: "Fin del directo", title: "Hasta la próxima", subtitle: "Gracias por pasarte." },
			offline: {
				badge: "Sin directo",
				title: "Ahora no estoy",
				subtitle: "Vuelve en el próximo directo.",
			},
		},
		alerts: {
			follow: "Gracias por seguir el canal.",
			sub: "Gracias por suscribirte.",
			resub: "{meses} meses ya. Gracias por seguir aquí.",
			gift: "Ha regalado {cantidad} subs al chat. Gracias.",
			raid: "Llega con {espectadores} personas. Bienvenidas.",
			bits: "{bits} bits. Muchas gracias.",
		},
		camera: { name },
		chat: { hidden: [] },
	});
}
