"use client";

import { Alert, Button, type ButtonHierarchy } from "@jotis-me/react";
import { type ReactNode, useState, useTransition } from "react";
import { SocialLogo } from "@/components/brand/SocialLogo";

type Action = () => Promise<{ error?: string }>;

/** Botón que lanza una Server Action y, si falla, enseña el error debajo. */
function ActionButton({
	action,
	children,
	hierarchy = "secondary",
	size = "md",
	destructive,
	iconLeading,
}: {
	action: Action;
	children: ReactNode;
	hierarchy?: ButtonHierarchy;
	size?: "sm" | "md" | "lg";
	destructive?: boolean;
	iconLeading?: ReactNode;
}) {
	const [pending, start] = useTransition();
	const [error, setError] = useState<string>();
	return (
		<div className="flex flex-col items-center gap-3">
			<Button
				hierarchy={hierarchy}
				size={size}
				destructive={destructive}
				loading={pending}
				iconLeading={iconLeading}
				onClick={() =>
					start(async () => {
						setError((await action()).error);
					})
				}
			>
				{children}
			</Button>
			{error ? (
				<div role="alert" className="w-full max-w-120 text-left">
					<Alert color="error" title="No se ha podido completar" description={error} />
				</div>
			) : null}
		</div>
	);
}

export function ConnectButton({ action }: { action: Action }) {
	return (
		<ActionButton
			action={action}
			hierarchy="primary"
			size="lg"
			iconLeading={<SocialLogo network="twitch" width={18} height={20} />}
		>
			Conectar eventos
		</ActionButton>
	);
}

export function DisconnectButton({ action }: { action: Action }) {
	return (
		<ActionButton action={action} destructive iconLeading="log-out-01">
			Desconectar
		</ActionButton>
	);
}

export function ReactivateButton({ action, primary }: { action: Action; primary: boolean }) {
	return (
		<ActionButton
			action={action}
			hierarchy={primary ? "primary" : "secondary"}
			size="sm"
			iconLeading="refresh-cw-01"
		>
			Reactivar
		</ActionButton>
	);
}
