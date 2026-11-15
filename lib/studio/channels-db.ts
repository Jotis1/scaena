// Cuentas con acceso al estudio en Postgres (modelo `StudioChannel`). Ver `channels.ts`.
import { db } from "../db";
import type { ChannelRegistry } from "./channels";

export const prismaChannelRegistry: ChannelRegistry = {
	byId(twitchId) {
		return db().studioChannel.findUnique({ where: { twitchId } });
	},
	byLogin(login) {
		return db().studioChannel.findUnique({ where: { login: login.toLowerCase() } });
	},
	list() {
		return db().studioChannel.findMany({ orderBy: { createdAt: "asc" } });
	},
	async upsertSignIn(i) {
		const login = i.login.toLowerCase();
		await db().studioChannel.upsert({
			where: { twitchId: i.twitchId },
			create: { twitchId: i.twitchId, login, name: i.name, image: i.image },
			update: { login, name: i.name, image: i.image },
		});
	},
	async add(r) {
		await db().studioChannel.create({ data: { ...r, login: r.login.toLowerCase() } });
	},
	async remove(twitchId) {
		await db().studioChannel.deleteMany({ where: { twitchId } });
	},
};
