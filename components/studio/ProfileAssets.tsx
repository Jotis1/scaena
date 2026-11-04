"use client";

import { Badge, Button, ChannelBanner, ChannelPanel, type IconName, Input } from "@jotis-me/react";
import { zipSync } from "fflate";
import { domToBlob } from "modern-screenshot";
import { type ReactNode, useRef, useState } from "react";
import type { BannerData, PanelData } from "@/lib/studio/panels";

// Estudio · Recursos (diseño: «Recursos»; specs/twitch-profile-assets; design.md, decisión 11). Cada pieza se
// enseña como se verá en Twitch y se exporta en el navegador desde una copia a tamaño real fuera de la pantalla:
// paneles a 2x (640 px) y banner a 1x (1200×480), con las fuentes de Regula ya cargadas.

const PANEL_SCALE = 2;
const BANNER_SCALE = 1;

function download(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Panel({ p }: { p: PanelData }) {
	return (
		<ChannelPanel
			title={p.title}
			icon={p.icon as IconName}
			rows={p.rows}
			action={
				p.action
					? { label: p.action.label, href: p.action.href, icon: "link-external-01" }
					: undefined
			}
		>
			{p.paragraphs.map((t) => (
				<p key={t}>{t}</p>
			))}
		</ChannelPanel>
	);
}

function Banner({ b, scale }: { b: BannerData; scale: number }) {
	return (
		<ChannelBanner
			eyebrow={b.eyebrow}
			name={b.name}
			tagline={b.tagline}
			schedule={b.schedule}
			scale={scale}
		/>
	);
}

export function ProfileAssets({ panels, banner }: { panels: PanelData[]; banner: BannerData }) {
	const nodes = useRef(new Map<string, HTMLElement>());
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string>();

	const render = async (file: string): Promise<Blob> => {
		const node = nodes.current.get(file);
		if (!node) throw new Error(`No hay nodo para ${file}`);
		// Sin las fuentes cargadas, la captura saldría con la del sistema.
		await document.fonts.ready;
		const blob = await domToBlob(node, {
			scale: file === banner.file ? BANNER_SCALE : PANEL_SCALE,
			type: "image/png",
		});
		if (!blob) throw new Error(`La captura de ${file} ha salido vacía`);
		return blob;
	};

	const run = async (key: string, job: () => Promise<void>) => {
		setBusy(key);
		setError(undefined);
		try {
			await job();
		} catch (e) {
			console.error(e);
			setError("No se ha podido generar la imagen. Recarga la página y vuelve a probar.");
		} finally {
			setBusy(null);
		}
	};
	const exportOne = (file: string) => run(file, async () => download(await render(file), file));
	const exportAll = () =>
		run("all", async () => {
			const files: Record<string, Uint8Array> = {};
			for (const file of [banner.file, ...panels.map((p) => p.file)])
				files[file] = new Uint8Array(await (await render(file)).arrayBuffer());
			// Los PNG ya van comprimidos: guardarlos tal cual es más rápido y pesa lo mismo.
			download(
				new Blob([zipSync(files, { level: 0 }) as BlobPart], { type: "application/zip" }),
				"scaena-perfil.zip",
			);
		});

	const keep = (file: string) => (el: HTMLElement | null) => {
		if (el) nodes.current.set(file, el);
		else nodes.current.delete(file);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-display text-display-sm font-semibold text-primary">Recursos</h1>
					<p className="max-w-180 text-md text-tertiary">
						Paneles y banner del perfil de Twitch. Se exportan en PNG al doble de tamaño para que
						se vean nítidos.
					</p>
				</div>
				<Button
					hierarchy="primary"
					size="md"
					iconLeading="download-01"
					loading={busy === "all"}
					onClick={exportAll}
				>
					Exportar todo
				</Button>
			</div>
			{error ? (
				<p role="alert" className="text-sm text-error-primary">
					{error}
				</p>
			) : null}

			<AssetRow
				label="Banner"
				preview={
					<div className="h-60 max-w-full flex-[0_0_600px] overflow-hidden rounded-lg">
						<Banner b={banner} scale={0.5} />
					</div>
				}
				title="Banner del perfil"
				size="1200 × 480"
				note="El lema y el horario habitual. Twitch lo recorta en móvil: el texto queda dentro de la zona segura."
				onExport={() => exportOne(banner.file)}
				busy={busy === banner.file}
			/>

			<h2 className="mt-2 text-lg font-semibold text-primary">Paneles</h2>
			{panels.map((p) => (
				<AssetRow
					key={p.slug}
					label={`Panel ${p.title}`}
					preview={
						<div className="flex-[0_0_320px]" data-panel={p.slug}>
							<Panel p={p} />
						</div>
					}
					title={p.title}
					size="320 px - PNG a 640 px"
					note={p.noLinkReason}
					link={p.action?.href}
					onExport={() => exportOne(p.file)}
					busy={busy === p.file}
				/>
			))}

			{/* Copias a tamaño real para exportar: fuera de la pantalla, sin escalar. */}
			<div
				aria-hidden="true"
				inert
				className="pointer-events-none fixed top-0 -left-[10000px]"
				data-export-nodes
			>
				<div ref={keep(banner.file)} data-export={banner.file} className="w-[1200px]">
					<Banner b={banner} scale={1} />
				</div>
				{panels.map((p) => (
					<div key={p.slug} ref={keep(p.file)} data-export={p.file} className="w-[320px]">
						<Panel p={p} />
					</div>
				))}
			</div>
		</div>
	);
}

function AssetRow({
	label,
	preview,
	title,
	size,
	note,
	link,
	onExport,
	busy,
}: {
	label: string;
	preview: ReactNode;
	title: string;
	size: string;
	note?: string;
	link?: string;
	onExport: () => void;
	busy: boolean;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<section aria-label={label} className="flex flex-wrap gap-6 rounded-xl border border-secondary p-5">
			{preview}
			<div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="text-md font-semibold text-primary">{title}</h3>
					<Badge color="gray" type="badge" size="sm">
						{size}
					</Badge>
				</div>
				{note ? <p className="-mt-1.5 text-sm text-tertiary">{note}</p> : null}
				{link ? (
					<div className="flex items-end gap-2">
						<div className="min-w-0 flex-auto">
							<Input
								label="Enlace del panel"
								size="sm"
								readOnly
								value={link}
								hint="Pégalo en el campo de enlace del panel, en Twitch."
								className="font-mono"
							/>
						</div>
						<div className="pb-6.5">
							<Button
								hierarchy="secondary"
								size="sm"
								iconOnly={copied ? "check" : "copy-01"}
								label={copied ? "Enlace copiado" : "Copiar enlace"}
								onClick={async () => {
									await navigator.clipboard.writeText(link);
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
								}}
							/>
						</div>
					</div>
				) : null}
				<div className="mt-auto">
					<Button
						hierarchy="secondary"
						size="sm"
						iconLeading="download-01"
						loading={busy}
						onClick={onExport}
					>
						Exportar PNG
					</Button>
				</div>
			</div>
		</section>
	);
}
