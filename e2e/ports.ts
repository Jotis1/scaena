/** Puerto del chat de Twitch falso: lo usan playwright.config.ts (al construir) y e2e/chat.spec.ts. */
export const FAKE_CHAT_PORT = 3198;

/** Puerto del Redis falso (e2e/fake-redis.ts): `KV_REST_API_URL` de los tests. */
export const FAKE_REDIS_PORT = 3199;
