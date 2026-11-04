// Cliente de Upstash Redis (REST). Una sola instancia por proceso; los tests ponen la suya con `setRedis`.
import { Redis } from "@upstash/redis";
import { env } from "../env";

let current: Redis | undefined;

export function redis(): Redis {
	if (!current) {
		const { KV_REST_API_URL, KV_REST_API_TOKEN } = env();
		current = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });
	}
	return current;
}

/** Solo para tests: sustituye el cliente. */
export function setRedis(client: Redis | undefined): void {
	current = client;
}
