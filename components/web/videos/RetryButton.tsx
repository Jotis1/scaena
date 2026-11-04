"use client";

import { Button } from "@jotis-me/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** «Reintentar»: vuelve a pedir la página al servidor, que vuelve a preguntar a YouTube. */
export function RetryButton() {
	const router = useRouter();
	const [pending, start] = useTransition();
	return (
		<Button
			hierarchy="primary"
			size="md"
			iconLeading="refresh-cw-01"
			loading={pending}
			onClick={() => start(() => router.refresh())}
		>
			Reintentar
		</Button>
	);
}
