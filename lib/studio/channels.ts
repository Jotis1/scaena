// Cuentas con acceso al estudio (specs/studio-accounts; design.md del cambio multi-channel-studio, decisiones 1 y 2):
// la lista y la foto de su Twitch, con la que se genera el perfil de un canal añadido. En Postgres (`StudioChannel`)
// y, en las pruebas, en memoria. La versión de Postgres va aparte (`channels-db.ts`) para no cargar Prisma aquí.

export interface StudioChannelRow {
	twitchId: string;
	login: string;
	name: string;
	image: string | null;
	description: string;
	/** Id de Twitch de quien la añadió desde «Cuentas»; \`null\` para la fila de un administrador. */
	addedBy: string | null;
	createdAt: Date;
}

/** Lo que se sabe de una cuenta al entrar con Twitch: sin descripción, que no viene en el perfil de OIDC. */
export interface SignInInfo {
	twitchId: string;
	login: string;
	name: string;
	image: string | null;
}

export interface ChannelRegistry {
	byId(twitchId: string): Promise<StudioChannelRow | null>;
	byLogin(login: string): Promise<StudioChannelRow | null>;
	list(): Promise<StudioChannelRow[]>;
	/** Al entrar: crea la fila (de un administrador) o pone al día login, nombre y foto. */
	upsertSignIn(info: SignInInfo): Promise<void>;
	add(row: Omit<StudioChannelRow, "createdAt">): Promise<void>;
	remove(twitchId: string): Promise<void>;
}

/** Para las pruebas: la lista en memoria. */
export function memoryChannelRegistry(rows: Omit<StudioChannelRow, "createdAt">[] = []): ChannelRegistry {
	const byId = new Map<string, StudioChannelRow>(
		rows.map((r) => [r.twitchId, { ...r, createdAt: new Date(0) }]),
	);
	return {
		async byId(id) {
			return byId.get(id) ?? null;
		},
		async byLogin(login) {
			const l = login.toLowerCase();
			return [...byId.values()].find((r) => r.login === l) ?? null;
		},
		async list() {
			return [...byId.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		},
		async upsertSignIn(i) {
			const old = byId.get(i.twitchId);
			byId.set(i.twitchId, {
				twitchId: i.twitchId,
				login: i.login.toLowerCase(),
				name: i.name,
				image: i.image,
				description: old?.description ?? "",
				addedBy: old?.addedBy ?? null,
				createdAt: old?.createdAt ?? new Date(),
			});
		},
		async add(r) {
			byId.set(r.twitchId, { ...r, login: r.login.toLowerCase(), createdAt: new Date() });
		},
		async remove(id) {
			byId.delete(id);
		},
	};
}

let override: ChannelRegistry | undefined;

/** Solo para pruebas: cambia la lista (`undefined` vuelve a Postgres). */
export function setChannelRegistry(r: ChannelRegistry | undefined): void {
	override = r;
}

export async function channelRegistry(): Promise<ChannelRegistry> {
	if (override) return override;
	const { prismaChannelRegistry } = await import("./channels-db");
	return prismaChannelRegistry;
}
