import { expect, test } from "@playwright/test";

test("sin sesión, el estudio lleva a la entrada", async ({ page }) => {
	await page.goto("/studio/overlays");
	await expect(page).toHaveURL(/\/studio\/login$/);
	await expect(page.getByRole("heading", { name: "Entra en el Estudio" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Entrar con Twitch" })).toBeVisible();
	// La guía de OBS y su máscara, también.
	await page.goto("/studio/guide");
	await expect(page).toHaveURL(/\/studio\/login$/);
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

test("el aviso dice con qué cuenta se ha entrado, dentro de la tarjeta", async ({ page }) => {
	await page.goto("/studio/login?error=account_not_allowed&account=otra_cuenta&id=42");
	const card = page
		.locator("main")
		.getByRole("heading", { name: "Entra en el Estudio" })
		.locator("xpath=../../..");
	await expect(
		card.getByText(
			"Has entrado como otra_cuenta (id 42), que no está entre las que pueden usar el Estudio. Si tienes otra cuenta de Twitch, prueba con ella.",
		),
	).toBeVisible();
	// «Probar con otra cuenta» es la única acción principal de la tarjeta.
	await expect(page.locator("main").locator("a.bg-brand-solid, button.bg-brand-solid")).toHaveCount(1);
});

test("la entrada tiene el nombre de la app y el botón de tema", async ({ page }) => {
	await page.goto("/studio/login");
	await expect(page.getByRole("button", { name: /^Tema: (Claro|Oscuro|Sistema)$/ }).first()).toBeVisible();
	await expect(page.getByRole("banner").getByText("Scaena", { exact: true }).first()).toBeVisible();
	// La cabecera de la web, con «Estudio» actual (sin sesión lleva aquí), y la vuelta a la web desde la tarjeta.
	await expect(page.getByRole("banner").getByRole("link", { name: "Estudio" }).first()).toHaveAttribute(
		"href",
		"/studio/login",
	);
	await expect(page.getByRole("link", { name: "Vuelve a la web del canal" })).toHaveAttribute("href", "/");
});
