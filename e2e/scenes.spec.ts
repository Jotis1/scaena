import { expect, type Page, test } from "@playwright/test";

const BASE = "/overlay/jotis1/scene";

test.use({ viewport: { width: 1920, height: 1080 } });

/** Errores de la consola (incluidos los avisos de hidratación de React), para que ninguna escena los tenga. */
function consoleErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("console", (m) => {
		if (m.type() === "error") errors.push(m.text());
	});
	page.on("pageerror", (e) => errors.push(e.message));
	return errors;
}

const COPY = {
	starting: ["Empezamos pronto", "Ya casi", "Unos minutos y empezamos."],
	brb: ["Pausa", "Vuelvo enseguida", "Un momento y seguimos con la partida."],
	ending: ["Fin del directo", "Hasta la próxima", "Gracias por pasarte."],
	offline: ["Sin directo", "Ahora no estoy", "Mientras tanto, los vídeos están en YouTube."],
} as const;

for (const [variant, texts] of Object.entries(COPY)) {
	test(`escena «${variant}»: llena 1920×1080 sin desplazamiento y con los textos del perfil`, async ({
		page,
	}) => {
		const errors = consoleErrors(page);
		await page.goto(`${BASE}/${variant}`);
		for (const t of texts) await expect(page.getByText(t, { exact: false })).toBeVisible();
		await expect(page.getByText("jotis1", { exact: true })).toBeVisible();
		await expect(page.getByText("twitch.tv/jotis1")).toBeVisible();

		const size = await page.evaluate(() => {
			// El primer hijo de `body` es un `div` oculto de Next; el lienzo es el primero visible.
			const canvas = document.body.querySelector(":scope > div:not([hidden])") as HTMLElement;
			const r = canvas.getBoundingClientRect();
			return {
				canvas: [Math.round(r.width), Math.round(r.height)],
				scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
			};
		});
		expect(size).toEqual({ canvas: [1920, 1080], scroll: [1920, 1080] });
		expect(errors).toEqual([]);
	});
}

test("«final» y «offline» llevan el horario en el pie, y `next` lo cambia", async ({ page }) => {
	await page.goto(`${BASE}/offline`);
	await expect(page.getByText("Normalmente, de 17:00 a 20:00")).toBeVisible();
	await page.goto(`${BASE}/ending?next=${encodeURIComponent("Mañana, a las 18:00")}`);
	await expect(page.getByText("Mañana, a las 18:00")).toBeVisible();
});

test("con `minutes=8`, la cuenta atrás de «vuelvo enseguida» empieza en 08:00", async ({ page }) => {
	await page.clock.install({ time: new Date("2026-11-04T17:00:00Z") });
	await page.goto(`${BASE}/brb?minutes=8`);
	await expect(page.getByText("08:00", { exact: true })).toBeVisible();
});

test("con un `target` a diez minutos, muestra 10:00 y baja cada segundo", async ({ page }) => {
	// El primer texto lo pinta el servidor con su hora; el reloj del navegador parte de la hora real para que
	// coincidan (como en OBS). Puede ir un segundo por detrás si el servidor tarda en responder.
	const now = Date.now();
	await page.clock.install({ time: now });
	const target = new Date(now + 10 * 60_000).toISOString();
	await page.goto(`${BASE}/starting?target=${encodeURIComponent(target)}`);
	const timer = page.getByRole("timer");
	await expect(timer).toHaveText(/^(10:00|09:59)$/);
	// Desde el primer tic manda el reloj del navegador: la cuenta es exacta y baja de segundo en segundo.
	await page.clock.runFor(1000);
	await expect(timer).toHaveText("09:59");
	await page.clock.runFor(1000);
	await expect(timer).toHaveText("09:58");
});

test("una cuenta atrás mal escrita no rompe la escena", async ({ page }) => {
	await page.goto(`${BASE}/starting?minutes=mucho&target=mañana`);
	await expect(page.getByText("Ya casi")).toBeVisible();
});

test("una escena o un canal que no existen dan 404", async ({ request }) => {
	expect((await request.get(`${BASE}/intermedio`)).status()).toBe(404);
	expect((await request.get("/overlay/otrocanal/scene/starting")).status()).toBe(404);
});
