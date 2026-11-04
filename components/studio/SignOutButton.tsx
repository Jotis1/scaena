"use client";

import { Button } from "@jotis-me/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** «Salir»: cierra la sesión en better-auth y vuelve a la entrada. */
export function SignOutButton() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const signOut = async () => {
		setLoading(true);
		await authClient.signOut();
		router.replace("/studio/login");
		router.refresh();
	};
	return (
		<Button
			hierarchy="tertiary"
			size="sm"
			iconOnly="log-out-01"
			label="Salir"
			loading={loading}
			onClick={signOut}
		/>
	);
}
