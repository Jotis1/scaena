// Dependencias reales de YouTube para el servidor.
import { env } from "../env";
import { store } from "../storage/redis";
import type { YouTubeDeps } from "./client";

export function youtubeDeps(): YouTubeDeps {
	return { store: store(), apiKey: env().YOUTUBE_API_KEY };
}
