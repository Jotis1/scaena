"use client";

import { Alert, AvatarLabel, Badge, Button, Input, Modal, Table } from "@jotis-me/react";
import { SearchLg, UserMinus01, UserPlus01 } from "@untitledui/icons";
import { useState } from "react";
import type { AccountView } from "@/lib/studio/accounts";
import type { TwitchUser } from "@/lib/twitch/users";

// «Cuentas» (specs/studio-accounts; design.md del cambio multi-channel-studio, decisión 7): buscar una cuenta de
// Twitch, verla antes de darle acceso, y la lista de quién entra, con «Quitar acceso» para las añadidas.

const DATE = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });
const initial = (name: string) => name.charAt(0).toUpperCase();

async function call<T>(method: string, query = "", body?: unknown): Promise<T | string> {
	const res = await fetch(`/api/studio/accounts${query}`, {
		method,
		headers: body ? { "content-type": "application/json" } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	}).catch(() => null);
	const json = (await res?.json().catch(() => null)) as (T & { error?: string }) | null;
	if (res?.ok && json) return json;
	return json?.error ?? "No se ha podido completar. Prueba otra vez.";
}

export function AccountsStudio({ initialAccounts }: { initialAccounts: AccountView[] }) {
	const [accounts, setAccounts] = useState(initialAccounts);
	const [login, setLogin] = useState("");
	const [found, setFound] = useState<{ user: TwitchUser; already: boolean } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [busy, setBusy] = useState<"search" | "add" | "remove" | null>(null);
	const [removing, setRemoving] = useState<AccountView | null>(null);

	const search = async () => {
		setBusy("search");
		setError(null);
		setNotice(null);
		setFound(null);
		const r = await call<{ user: TwitchUser; already: boolean }>(
			"GET",
			`?login=${encodeURIComponent(login)}`,
		);
		setBusy(null);
		if (typeof r === "string") return setError(r);
		setFound(r);
	};
	const add = async () => {
		if (!found) return;
		setBusy("add");
		const r = await call<{ accounts: AccountView[] }>("POST", "", { login: found.user.login });
		setBusy(null);
		if (typeof r === "string") return setError(r);
		setAccounts(r.accounts);
		setNotice(`${found.user.name} ya puede entrar en el estudio con su cuenta de Twitch.`);
		setFound(null);
		setLogin("");
	};
	const remove = async () => {
		if (!removing) return;
		setBusy("remove");
		const r = await call<{ accounts: AccountView[]; warning?: string }>(
			"DELETE",
			`?id=${removing.twitchId}`,
		);
		setBusy(null);
		const who = removing.name;
		setRemoving(null);
		if (typeof r === "string") return setError(r);
		setAccounts(r.accounts);
		setNotice(r.warning ?? `${who} ya no tiene acceso. Sus datos se guardan por si vuelve.`);
	};

	return (
		<div className="flex flex-col gap-8">
			<section aria-labelledby="accounts-add" className="flex flex-col gap-4">
				<h2 id="accounts-add" className="text-lg font-semibold text-primary">
					Dar acceso
				</h2>
				<form
					className="flex flex-wrap items-end gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						if (login.trim()) void search();
					}}
				>
					<div className="min-w-60 flex-1">
						<Input
							label="Usuario de Twitch"
							placeholder="Su usuario, sin @"
							value={login}
							hint="Entra con su propio canal: sus overlays, sus metas y sus recursos, sin ver los tuyos."
							onChange={(e) => setLogin(e.target.value)}
						/>
					</div>
					<Button
						type="submit"
						hierarchy="secondary"
						size="md"
						iconLeading={SearchLg}
						loading={busy === "search"}
						disabled={!login.trim()}
						className="mb-6"
					>
						Buscar
					</Button>
				</form>
				{found ? (
					<section
						aria-label="Cuenta encontrada"
						className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary p-5"
					>
						<div className="flex min-w-0 flex-col gap-2">
							<AvatarLabel
								size="lg"
								src={found.user.image ?? undefined}
								initials={initial(found.user.name)}
								name={found.user.name}
								supporting={`twitch.tv/${found.user.login}`}
							/>
							{found.user.description ? (
								<p className="max-w-160 text-sm text-tertiary">{found.user.description}</p>
							) : null}
						</div>
						{found.already ? (
							<Badge color="success">Ya tiene acceso</Badge>
						) : (
							<Button
								hierarchy="primary"
								size="md"
								iconLeading={UserPlus01}
								loading={busy === "add"}
								onClick={add}
							>
								Darle acceso
							</Button>
						)}
					</section>
				) : null}
				{error ? (
					<p role="alert" className="text-sm text-error-primary">
						{error}
					</p>
				) : null}
				{notice ? <Alert color="success" title={notice} /> : null}
			</section>

			<Table
				title="Quién entra en el estudio"
				count={accounts.length}
				description="Cada cuenta trabaja con su canal. Los administradores son los de la configuración y no se quitan desde aquí."
				columns={[
					{ key: "who", label: "Cuenta", primary: true },
					{ key: "role", label: "Acceso" },
					{ key: "action", label: "Acción", align: "right" },
				]}
				rows={accounts.map((a) => ({
					id: a.twitchId,
					who: (
						<AvatarLabel
							size="md"
							src={a.image ?? undefined}
							initials={initial(a.name)}
							name={a.name}
							supporting={`twitch.tv/${a.login}`}
						/>
					),
					role: a.admin ? (
						<Badge color="brand">Administrador</Badge>
					) : (
						<span className="text-sm text-tertiary">
							{a.addedByName ? `Añadida por ${a.addedByName} el ` : "Añadida el "}
							{DATE.format(new Date(a.createdAt))}
						</span>
					),
					action: a.admin ? null : (
						<Button
							hierarchy="secondary"
							size="sm"
							iconLeading={UserMinus01}
							onClick={() => setRemoving(a)}
						>
							Quitar acceso
						</Button>
					),
				}))}
			/>

			<Modal
				open={removing !== null}
				icon={UserMinus01}
				color="error"
				title={removing ? `¿Quitar el acceso a ${removing.name}?` : ""}
				description="Sale del estudio al momento y sus eventos de Twitch se dan de baja. Su perfil, sus metas y su token se guardan: si vuelves a darle acceso, lo tiene todo como estaba."
				onClose={() => setRemoving(null)}
				actions={
					<div className="flex w-full gap-3">
						<Button
							hierarchy="secondary"
							size="lg"
							className="flex-1"
							onClick={() => setRemoving(null)}
						>
							Cancelar
						</Button>
						<Button
							hierarchy="primary"
							size="lg"
							destructive
							className="flex-1"
							loading={busy === "remove"}
							onClick={remove}
						>
							Quitar acceso
						</Button>
					</div>
				}
			/>
		</div>
	);
}
