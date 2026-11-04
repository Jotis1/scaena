"use client";

import { Button } from "@jotis-me/react";
import { useState } from "react";
import { SocialLogo } from "@/components/brand/SocialLogo";
import { authClient } from "@/lib/auth-client";

/** «Entrar con Twitch» (principal) o, tras un rechazo, «Probar con otra cuenta» (secundario). */
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
			hierarchy={otherAccount ? "secondary" : "primary"}
			size="lg"
			className="w-full"
			loading={loading}
			iconLeading={<SocialLogo network="twitch" width={18} height={20} />}
			onClick={signIn}
		>
			{otherAccount ? "Probar con otra cuenta" : "Entrar con Twitch"}
		</Button>
	);
}
