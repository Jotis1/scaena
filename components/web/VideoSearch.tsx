"use client";

import { Input } from "@jotis-me/react";
import { SearchLg } from "@untitledui/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense } from "react";

/** `/videos?q=…`, o `/videos` si no hay texto. */
export function searchHref(text: string): string {
	const q = text.replace(/\s+/g, " ").trim();
	return q ? `/videos?${new URLSearchParams({ q })}` : "/videos";
}

function SearchForm({ initial, className }: { initial: string; className?: string }) {
	const router = useRouter();
	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const value = new FormData(e.currentTarget).get("q");
		router.push(searchHref(typeof value === "string" ? value : ""));
	};
	return (
		// `key`: al cambiar el `q` de la URL (otra búsqueda, «Quitar la búsqueda») el campo vuelve a arrancar con él.
		<search className={className}>
			<form key={initial} action="/videos" method="get" onSubmit={onSubmit}>
				<Input
					type="search"
					name="q"
					size="sm"
					icon={SearchLg}
					aria-label="Buscar vídeos"
					placeholder="Buscar vídeos y directos"
					defaultValue={initial}
					maxLength={80}
					enterKeyHint="search"
				/>
			</form>
		</search>
	);
}

function SearchWithParams({ className }: { className?: string }) {
	const params = useSearchParams();
	const path = usePathname();
	return <SearchForm initial={path === "/videos" ? (params.get("q") ?? "") : ""} className={className} />;
}

// Buscador de vídeos y directos de la cabecera (specs/channel-site, «Buscador de vídeos»; design.md, decisión 3). Un
// formulario GET a `/videos` que sin JavaScript también funciona; en el cliente navega sin recargar. Sin `id` fijos:
// la cabecera lo pinta más de una vez (fila de escritorio, fila móvil y panel del menú).
export function VideoSearch({ className }: { className?: string }) {
	// `useSearchParams` necesita `Suspense` en las páginas que se generan al construir; hasta entonces, el campo vacío.
	return (
		<Suspense fallback={<SearchForm initial="" className={className} />}>
			<SearchWithParams className={className} />
		</Suspense>
	);
}
