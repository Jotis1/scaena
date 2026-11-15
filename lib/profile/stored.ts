// Cambios del perfil en Postgres (modelo `ChannelProfile`). Va aparte de `index.ts` para que las pruebas y los
// scripts que solo leen el YAML no carguen Prisma.
import { db } from "../db";
import type { ProfileEdits, ProfileStore } from ".";

export const prismaProfileStore: ProfileStore = {
	async read(login) {
		const row = await db().channelProfile.findUnique({ where: { login } });
		return row?.data ?? null;
	},
	async write(login, data: ProfileEdits) {
		const json = JSON.parse(JSON.stringify(data));
		await db().channelProfile.upsert({
			where: { login },
			create: { login, data: json },
			update: { data: json },
		});
	},
	async clear(login) {
		await db().channelProfile.deleteMany({ where: { login } });
	},
};
