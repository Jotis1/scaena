// Cargas de ejemplo con la forma de la documentación de Twitch
// (https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/). Las usan los tests.
import type { Notification } from "./normalize";

const channel = {
	broadcaster_user_id: "1337",
	broadcaster_user_login: "jotis_1",
	broadcaster_user_name: "jotis_1",
};
const sub = (type: string, version = "1") => ({
	id: "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
	type,
	version,
	status: "enabled",
	cost: 0,
	condition: { broadcaster_user_id: "1337" },
	transport: { method: "webhook", callback: "https://scaena.jotis.me/api/twitch/eventsub" },
	created_at: "2026-11-04T17:00:00.000Z",
});

export const FOLLOW: Notification = {
	subscription: sub("channel.follow", "2"),
	event: {
		user_id: "1234",
		user_login: "cool_user",
		user_name: "Cool_User",
		...channel,
		followed_at: "2026-11-04T17:00:00.000Z",
	},
};

export const SUB: Notification = {
	subscription: sub("channel.subscribe"),
	event: {
		user_id: "1234",
		user_login: "cool_user",
		user_name: "Cool_User",
		...channel,
		tier: "1000",
		is_gift: false,
	},
};

export const GIFTED_SUB: Notification = {
	subscription: sub("channel.subscribe"),
	event: {
		user_id: "5678",
		user_login: "suertudo",
		user_name: "Suertudo",
		...channel,
		tier: "1000",
		is_gift: true,
	},
};

export const RESUB: Notification = {
	subscription: sub("channel.subscription.message"),
	event: {
		user_id: "1234",
		user_login: "cool_user",
		user_name: "Cool_User",
		...channel,
		tier: "2000",
		message: { text: "Catorce meses <b>ya</b>", emotes: [] },
		cumulative_months: 14,
		streak_months: null,
		duration_months: 1,
	},
};

export const GIFT: Notification = {
	subscription: sub("channel.subscription.gift"),
	event: {
		user_id: "1234",
		user_login: "cool_user",
		user_name: "Cool_User",
		...channel,
		total: 5,
		tier: "1000",
		cumulative_total: 284,
		is_anonymous: false,
	},
};

export const ANONYMOUS_GIFT: Notification = {
	subscription: sub("channel.subscription.gift"),
	event: {
		user_id: null,
		user_login: null,
		user_name: null,
		...channel,
		total: 2,
		tier: "1000",
		is_anonymous: true,
	},
};

export const BITS: Notification = {
	subscription: sub("channel.cheer"),
	event: {
		is_anonymous: false,
		user_id: "1234",
		user_login: "cool_user",
		user_name: "Cool_User",
		...channel,
		message: "pogchamp",
		bits: 500,
	},
};

export const RAID: Notification = {
	subscription: { ...sub("channel.raid"), condition: { to_broadcaster_user_id: "1337" } },
	event: {
		from_broadcaster_user_id: "9001",
		from_broadcaster_user_login: "otro_canal",
		from_broadcaster_user_name: "Otro_Canal",
		to_broadcaster_user_id: "1337",
		to_broadcaster_user_login: "jotis_1",
		to_broadcaster_user_name: "jotis_1",
		viewers: 1284,
	},
};

export const ONLINE: Notification = {
	subscription: sub("stream.online"),
	event: { id: "9001", ...channel, type: "live", started_at: "2026-11-04T17:00:00Z" },
};

export const OFFLINE: Notification = { subscription: sub("stream.offline"), event: { ...channel } };
