import { expect, test } from "@playwright/test";

test("sin sesión, el estudio lleva a la entrada", async ({ page }) => {
	await page.goto("/studio/overlays");
	await expect(page).toHaveURL(/\/studio\/login$/);
	await expect(page.getByRole("heading", { name: "Entra en el Estudio" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Entrar con Twitch" })).toBeVisible();
});

test("la API del estudio responde 401 sin sesión", async ({ request }) => {
	const res = await request.post("/api/studio/test", { data: {} });
	expect(res.status()).toBe(401);
});

test("una cuenta sin acceso ve el aviso y la opción de probar con otra", async ({ page }) => {
	await page.goto("/studio/login?error=account_not_allowed");
	await expect(page.getByText("Esta cuenta no tiene acceso")).toBeVisible();
	await expect(page.getByRole("button", { name: "Probar con otra cuenta" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Entrar con Twitch" })).toHaveCount(0);
});

test("la entrada tiene el nombre de la app y el botón de tema", async ({ page }) => {
	await page.goto("/studio/login");
	await expect(page.getByRole("button", { name: /Cambiar a (oscuro|claro)/ })).toBeVisible();
	await expect(page.getByText("Scaena", { exact: true })).toBeVisible();
});
