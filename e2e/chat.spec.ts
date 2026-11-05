import { expect, type Page, test } from "@playwright/test";
import { WebSocketServer, type WebSocket as WsSocket } from "ws";
import { FAKE_CHAT_PORT } from "./ports";

// El overlay se construye apuntando a este chat de Twitch falso (playwright.config.ts). Todos los tests del
// fichero comparten el puerto, así que van en serie.
test.describe.configure({ mode: "serial" });

let wss: WebSocketServer;
let connections: WsSocket[] = [];

test.beforeAll(() => {
	wss = new WebSocketServer({ port: FAKE_CHAT_PORT });
	wss.on("connection", (s) => {
		connections.push(s);
		s.on("message", (d) => {
			const join = /JOIN (#\S+)/.exec(d.toString());
			if (join) s.send(`:justinfan!justinfan@justinfan.tmi.twitch.tv JOIN ${join[1]}\r\n`);
		});
	});
});

test.afterAll(async () => {
	for (const c of connections) c.terminate();
	await new Promise<void>((r) => wss.close(() => r()));
});
test.beforeEach(() => {
	connections = [];
});

const msg = (id: string, user: string, userId: string, text: string, badges = "") =>
	`@badges=${badges};display-name=${user};id=${id};user-id=${userId} :${user.toLowerCase()}!x@x.tmi.twitch.tv PRIVMSG #jotis_1 :${text}\r\n`;

async function openChat(page: Page, query = "") {
	await page.goto(`/overlay/jotis_1/chat${query}`);
	await expect.poll(() => connections.length).toBe(1);
	const s = connections[0] as WsSocket;
	// Espera a que el cliente haya pedido unirse al canal antes de mandarle nada.
	await new Promise<void>((r) => {
		if (s.readyState === s.OPEN) setTimeout(r, 200);
		else s.once("open", () => setTimeout(r, 200));
	});
	return (line: string) => s.send(line);
}

test("un mensaje con HTML se pinta como texto y no ejecuta nada", async ({ page }) => {
	let dialog = false;
	page.on("dialog", async (d) => {
		dialog = true;
		await d.dismiss();
	});
	const send = await openChat(page);
	const html = "<img src=x onerror=alert(1)>";
	send(msg("m1", "Ana", "1001", html));
	await expect(page.getByText(html, { exact: true })).toBeVisible();
	expect(await page.locator("img").count()).toBe(0);
	expect(dialog).toBe(false);
});

test("muestra nombre e insignias, y respeta borrados y baneos", async ({ page }) => {
	const send = await openChat(page);
	send(msg("m1", "Ronni", "2002", "Hay un cofre detrás de la roca.", "moderator/1,subscriber/12"));
	send(msg("m2", "Ana", "1001", "Ese pasillo no lo has mirado."));
	send(msg("m3", "Ronni", "2002", "Fijo que sí."));
	await expect(page.getByText("Fijo que sí.")).toBeVisible();
	await expect(page.getByText("Ronni").first()).toBeVisible();

	// Borrado de un mensaje.
	send("@login=ana;target-msg-id=m2 :tmi.twitch.tv CLEARMSG #jotis_1 :Ese pasillo no lo has mirado.\r\n");
	await expect(page.getByText("Ese pasillo no lo has mirado.")).toHaveCount(0);
	// Baneo: se van todos los mensajes de Ronni.
	send("@ban-duration=600;target-user-id=2002 :tmi.twitch.tv CLEARCHAT #jotis_1 :ronni\r\n");
	await expect(page.getByText("Hay un cofre detrás de la roca.")).toHaveCount(0);
	await expect(page.getByText("Fijo que sí.")).toHaveCount(0);
});

test("los comandos no salen y la limpieza del chat vacía el overlay", async ({ page }) => {
	const send = await openChat(page);
	send(msg("m1", "Ana", "1001", "!horario"));
	send(msg("m2", "Ana", "1001", "esto sí"));
	await expect(page.getByText("esto sí")).toBeVisible();
	await expect(page.getByText("!horario")).toHaveCount(0);
	send("@room-id=1 :tmi.twitch.tv CLEARCHAT #jotis_1\r\n");
	await expect(page.getByText("esto sí")).toHaveCount(0);
});

test("si Twitch corta la conexión, vuelve a conectar y conserva lo que se veía", async ({ page }) => {
	const send = await openChat(page);
	send(msg("m1", "Ana", "1001", "antes del corte"));
	await expect(page.getByText("antes del corte")).toBeVisible();
	(connections[0] as WsSocket).terminate();
	await expect.poll(() => connections.length, { timeout: 5000 }).toBe(2);
	await new Promise((r) => setTimeout(r, 300));
	(connections[1] as WsSocket).send(msg("m2", "Ana", "1001", "después del corte"));
	await expect(page.getByText("después del corte")).toBeVisible();
	await expect(page.getByText("antes del corte")).toBeVisible();
});

test("ancho, alto y translúcido por parámetro; el fondo de la página sigue transparente", async ({
	page,
}) => {
	await openChat(page, "?width=500&height=600&translucent=1");
	const box = await page.getByRole("log").boundingBox();
	expect(box?.width).toBe(500);
	expect(box?.height).toBe(600);
	expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
		"rgba(0, 0, 0, 0)",
	);
});
