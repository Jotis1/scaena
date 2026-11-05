import { describe, expect, it } from "vitest";
import { memoryStore } from "../storage/memory";
import { API, fetchVideos, type Video, type YouTubeDeps } from "./client";
import * as F from "./fixtures";
import { FRESH_MS, getVideos, videoPage } from "./videos";

const CHANNEL = "1337";
const HANDLE = "@jotis_1";

/** YouTube falso: cada ruta responde con lo que se le dé; cuenta las llamadas. */
function fakeYouTube(routes: { videos: object[]; playlist?: object[]; fail?: number }) {
	const calls: string[] = [];
	const playlistPages = [
		...(routes.playlist ?? [F.playlistItems(routes.videos.map((v) => (v as { id: string }).id))]),
	];
	const f: typeof fetch = async (input) => {
		const url = new URL(String(input));
		const path = url.pathname.replace("/youtube/v3/", "");
		calls.push(path);
		if (routes.fail) return Response.json(F.QUOTA_EXCEEDED, { status: routes.fail });
		if (path === "channels") return Response.json(F.CHANNELS);
		if (path === "playlistItems") {
			const token = url.searchParams.get("pageToken");
			return Response.json(token ? playlistPages[Number(token)] : playlistPages[0]);
		}
		const ids = (url.searchParams.get("id") ?? "").split(",");
		return Response.json({ items: routes.videos.filter((v) => ids.includes((v as { id: string }).id)) });
	};
	return { f, calls };
}

const deps = (
	f: typeof fetch,
	store = memoryStore(),
	now?: () => number,
): YouTubeDeps & { now?: () => number } => ({
	store,
	apiKey: "k",
	fetch: f,
	now,
});

describe("cliente de YouTube con las respuestas reales de @jotis_1", () => {
	it("saca los cuatro vídeos públicos, del más reciente al más antiguo, con duración y miniatura", async () => {
		const y = fakeYouTube({ videos: F.REAL_VIDEOS.items, playlist: [F.REAL_PLAYLIST] });
		const videos = await fetchVideos(deps(y.f), CHANNEL, HANDLE);
		expect(videos.map((v) => [v.id, v.duration])).toEqual([
			["zI2qmxGvITE", 3 * 3600 + 2 * 60 + 17],
			["pHDDITe04a4", 7 * 60 + 18],
			["golKyuuiUn0", 8 * 60 + 39],
			["SmrBkrLmyAc", 6 * 60 + 44],
		]);
		expect(videos[0]).toMatchObject({
			title: "YoruCraft #1 | Full VOD Twitch ft. Shir0",
			publishedAt: "2024-04-03T22:16:40Z",
			thumbnail: "https://i.ytimg.com/vi/zI2qmxGvITE/maxresdefault.jpg",
		});
	});

	it("un directo ya emitido (con `liveStreamingDetails` y fin) entra en la lista", async () => {
		const ended = F.REAL_VIDEOS.items.find((v) => v.id === "pHDDITe04a4") as {
			liveStreamingDetails?: object;
		};
		expect(ended.liveStreamingDetails).toHaveProperty("actualEndTime");
		const y = fakeYouTube({ videos: F.REAL_VIDEOS.items, playlist: [F.REAL_PLAYLIST] });
		expect((await fetchVideos(deps(y.f), CHANNEL, HANDLE)).map((v) => v.id)).toContain("pHDDITe04a4");
	});
});

describe("cliente de YouTube", () => {
	it("busca la lista de subidas por handle y pasa la clave", async () => {
		const urls: string[] = [];
		const y = fakeYouTube({ videos: [F.video("a")] });
		const spy: typeof fetch = (i, init) => {
			urls.push(String(i));
			return y.f(i, init);
		};
		await fetchVideos(deps(spy), CHANNEL, HANDLE);
		const ch = new URL(urls[0] ?? "");
		expect(ch.origin + ch.pathname).toBe(`${API}/channels`);
		expect(ch.searchParams.get("forHandle")).toBe("@jotis_1");
		expect(ch.searchParams.get("key")).toBe("k");
		expect(new URL(urls[1] ?? "").searchParams.get("playlistId")).toBe("UUc64u2L7fMMoXQ2OngYmVXQ");
	});

	it("quita privados, ocultos, eliminados y estrenos pendientes, y saca la duración", async () => {
		const y = fakeYouTube({
			videos: [
				F.video("ok", { duration: "PT3H12M40S" }),
				F.video("privado", { privacyStatus: "private" }),
				F.video("oculto", { privacyStatus: "unlisted" }),
				F.video("estreno", {
					liveBroadcastContent: "upcoming",
					live: { scheduledStartTime: "2026-12-01T18:00:00Z" },
				}),
				F.video("directo-pasado", { live: { actualEndTime: "2026-10-01T20:00:00Z" } }),
			],
			// «borrado» está en la lista de subidas pero `videos.list` ya no lo devuelve.
			playlist: [F.playlistItems(["ok", "privado", "oculto", "estreno", "directo-pasado", "borrado"])],
		});
		const videos = await fetchVideos(deps(y.f), CHANNEL, HANDLE);
		expect(videos.map((v) => v.id).sort()).toEqual(["directo-pasado", "ok"]);
		expect(videos.find((v) => v.id === "ok")).toMatchObject({
			duration: 11560,
			thumbnail: "https://i.ytimg.com/vi/ok/maxresdefault.jpg",
		});
	});

	it("recorre todas las páginas y ordena del más reciente al más antiguo", async () => {
		const y = fakeYouTube({
			videos: [
				F.video("viejo", { publishedAt: "2026-01-01T00:00:00Z" }),
				F.video("nuevo", { publishedAt: "2026-10-30T00:00:00Z" }),
			],
			playlist: [F.playlistItems(["viejo"], "1"), F.playlistItems(["nuevo"])],
		});
		expect((await fetchVideos(deps(y.f), CHANNEL, HANDLE)).map((v) => v.id)).toEqual(["nuevo", "viejo"]);
	});
});

describe("caché de vídeos", () => {
	it("muchas lecturas dentro de la hora: una sola consulta", async () => {
		let clock = 0;
		const store = memoryStore(() => clock);
		const y = fakeYouTube({ videos: [F.video("a")] });
		const d = deps(y.f, store, () => clock);
		for (let i = 0; i < 1000; i++) {
			await getVideos(d, CHANNEL, HANDLE);
			clock += 3000;
		}
		expect(y.calls.filter((c) => c === "videos")).toHaveLength(1);
		clock = FRESH_MS + 1;
		await getVideos(d, CHANNEL, HANDLE);
		expect(y.calls.filter((c) => c === "videos")).toHaveLength(2);
	});

	it("cuota agotada: se sirve la copia", async () => {
		let clock = 0;
		const store = memoryStore(() => clock);
		await getVideos(
			deps(fakeYouTube({ videos: [F.video("a")] }).f, store, () => clock),
			CHANNEL,
			HANDLE,
		);
		clock = FRESH_MS + 1;
		const down = fakeYouTube({ videos: [], fail: 403 });
		expect(
			await getVideos(
				deps(down.f, store, () => clock),
				CHANNEL,
				HANDLE,
			),
		).toMatchObject({
			stale: true,
			videos: [{ id: "a" }],
		});
	});

	it("sin copia y con YouTube caído: lista vacía", async () => {
		const down = fakeYouTube({ videos: [], fail: 500 });
		expect(await getVideos(deps(down.f), CHANNEL, HANDLE)).toEqual({ videos: [], stale: true });
	});
});

const many = (n: number, title = (i: number) => `Vídeo ${i}`): Video[] =>
	Array.from({ length: n }, (_, i) => ({
		id: `v${i + 1}`,
		title: title(i + 1),
		publishedAt: "2026-10-29T00:00:00Z",
		thumbnail: "",
		duration: 60,
	}));

describe("paginación", () => {
	it("página 2 de 30 → vídeos 13 a 24", () => {
		const p = videoPage(many(30), "all", 2);
		expect(p.items.map((v) => v.id)).toEqual(Array.from({ length: 12 }, (_, i) => `v${i + 13}`));
		expect(p).toMatchObject({ page: 2, pages: 3, total: 30 });
	});

	it("el filtro `live` se aplica antes de paginar", () => {
		// Impares: directos; pares: editados.
		const videos = many(30, (i) => (i % 2 ? `Parte ${i} - Elden Ring #${i}` : `Resumen ${i}`));
		const p = videoPage(videos, "live", 2);
		expect(p.total).toBe(15);
		expect(p.pages).toBe(2);
		expect(p.items).toHaveLength(3);
		expect(p.items.every((v) => v.parsed.kind === "live")).toBe(true);
		expect(p.items.map((v) => v.id)).toEqual(["v25", "v27", "v29"]);
	});

	it("una página fuera de rango da la última, y una que no es número, la primera", () => {
		expect(videoPage(many(30), "all", 9).page).toBe(3);
		expect(videoPage(many(30), "all", Number.NaN).page).toBe(1);
		expect(videoPage([], "all", 1)).toMatchObject({ items: [], page: 1, pages: 1, total: 0 });
	});
});
