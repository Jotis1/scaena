"use client";

import { Button } from "@jotis-me/react";
import { RefreshCw01 } from "@untitledui/icons";
import { useState } from "react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import { authClient } from "@/lib/auth-client";

/**
 * «Entrar con Twitch» o, tras un rechazo, «Probar con otra cuenta» con el icono de volver a intentar. Las dos son la
 * acción principal de la tarjeta (diseño: «Acceso» y «Acceso - cuenta sin acceso»).
 */
export function SignInWithTwitch({ otherAccount = false }: { otherAccount?: boolean }) {
	const [loading, setLoading] = useState(false);
	const signIn = async () => {
		setLoading(true);
		await authClient.signIn.social({
			provider: "twitch",
			callbackURL: "/studio/overlays",
			errorCallbackURL: "/studio/login",
		});
	};
	return (
		<Button
			hierarchy="primary"
			size="lg"
			className="w-full"
			loading={loading}
			iconLeading={otherAccount ? RefreshCw01 : <SocialLogo network="twitch" width={18} height={20} />}
			onClick={signIn}
		>
			{otherAccount ? "Probar con otra cuenta" : "Entrar con Twitch"}
		</Button>
	);
}
