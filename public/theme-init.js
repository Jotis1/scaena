// Tema de la web antes de pintar (design.md, decisión 12).
// En Regula, `dark:` responde a la clase `dark-mode`, no a la preferencia del sistema.
// Manda la elección guardada (`theme`: "light" o "dark"); sin elección, el sistema.
(() => {
	const root = document.documentElement;
	const media = window.matchMedia("(prefers-color-scheme: dark)");
	const stored = () => {
		try {
			const value = localStorage.getItem("theme");
			return value === "light" || value === "dark" ? value : null;
		} catch {
			return null;
		}
	};
	const apply = () => {
		const choice = stored();
		root.classList.toggle("dark-mode", choice ? choice === "dark" : media.matches);
	};
	apply();
	media.addEventListener("change", () => {
		if (!stored()) apply();
	});
})();
