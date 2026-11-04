import { expect, test } from "@playwright/test";

test("better-auth responde en /api/auth", async ({ request }) => {
	const res = await request.get("/api/auth/ok");
	expect(res.status()).toBe(200);
	expect(await res.json()).toEqual({ ok: true });
});
