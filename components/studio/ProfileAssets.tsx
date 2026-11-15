"use client";

import { Badge, Button, ChannelBanner, ChannelPanel, Input } from "@jotis-me/react";
import { Check, Copy01, Download01, LinkExternal01 } from "@untitledui/icons";
import { zipSync } from "fflate";
import { domToBlob } from "modern-screenshot";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { PROFILE_ICONS } from "@/lib/icons";
import type { BannerData, PanelData } from "@/lib/studio/panels";
import { StudioPageHeader } from "./StudioContent";

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
			icon={PROFILE_ICONS[p.icon]}
			rows={p.rows}
			action={
				p.action ? { label: p.action.label, href: p.action.href, icon: LinkExternal01 } : undefined
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
		<div className="flex flex-col gap-10">
			<StudioPageHeader
				title="Recursos"
				description="Las imágenes del perfil de Twitch, hechas con los datos del canal. Se descargan aquí y se suben a mano allí: Twitch no deja hacerlo de otra forma."
				aside={
					<Button
						hierarchy="primary"
						size="md"
						iconLeading={Download01}
						loading={busy === "all"}
						onClick={exportAll}
					>
						Descargar todo (.zip)
					</Button>
				}
			/>
			{error ? (
				<p role="alert" className="text-sm text-error-primary">
					{error}
				</p>
			) : null}

			<section aria-labelledby="panels-title" className="flex flex-col gap-5">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<h2 id="panels-title" className="text-xl font-semibold text-primary">
						Paneles del perfil
					</h2>
					<Badge color="gray" type="badge" size="md">
						{`${panels.length} paneles - PNG de 640 px de ancho`}
					</Badge>
				</div>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(352px,100%),1fr))] items-start gap-6">
					{panels.map((p) => (
						<PanelItem
							key={p.slug}
							p={p}
							onExport={() => exportOne(p.file)}
							busy={busy === p.file}
						/>
					))}
				</div>
			</section>

			<section aria-labelledby="banner-title" className="flex flex-col gap-5">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<h2 id="banner-title" className="text-xl font-semibold text-primary">
						Banner del canal
					</h2>
					<Badge color="gray" type="badge" size="md">
						PNG de 1200 × 480
					</Badge>
				</div>
				<article
					aria-label="Banner"
					className="flex flex-col overflow-hidden rounded-xl border border-secondary"
				>
					<div className="bg-secondary p-4">
						<div className="mx-auto aspect-[5/2] w-full max-w-225 overflow-hidden rounded-lg">
							<ScaledBanner b={banner} />
						</div>
					</div>
					<AssetFooter file={banner.file}>
						<Button
							hierarchy="secondary"
							size="sm"
							iconLeading={Download01}
							loading={busy === banner.file}
							onClick={() => exportOne(banner.file)}
						>
							Descargar banner
						</Button>
					</AssetFooter>
				</article>
				<p className="max-w-180 text-sm text-tertiary">
					Los textos salen del perfil del canal. Si cambias el horario o las normas, vuelve a
					descargar: las imágenes de Twitch no se enteran solas.
				</p>
			</section>

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

/** El banner, encogido al ancho de su caja (900 px como mucho, 5:2 como el de verdad). */
function ScaledBanner({ b }: { b: BannerData }) {
	const ref = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(0.75);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => el.clientWidth > 0 && setScale(el.clientWidth / 1200);
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return (
		<div ref={ref} className="size-full">
			<Banner b={b} scale={scale} />
		</div>
	);
}

/** Pie de cada pieza: el nombre del PNG y su botón (diseño: «Recursos»). */
function AssetFooter({ file, children }: { file: string; children: ReactNode }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-secondary px-4 py-3">
			<span className="font-mono text-xs text-tertiary">{file}</span>
			{children}
		</div>
	);
}

/** Un panel tal como se verá en Twitch, su enlace (si lleva) para copiar, su nota y «Descargar». */
function PanelItem({ p, onExport, busy }: { p: PanelData; onExport: () => void; busy: boolean }) {
	const [copied, setCopied] = useState(false);
	const link = p.action?.href;
	return (
		<article
			aria-label={`Panel ${p.title}`}
			className="flex flex-col overflow-hidden rounded-xl border border-secondary"
		>
			<div className="flex justify-center bg-secondary p-4" data-panel={p.slug}>
				<Panel p={p} />
			</div>
			{link || p.noLinkReason ? (
				<div className="flex flex-col gap-2 border-t border-secondary px-4 py-3">
					{link ? (
						<Input
							label="Enlace del panel"
							size="sm"
							readOnly
							value={link}
							hint="Va en el campo de enlace del panel, en Twitch."
							className="[&_input]:font-mono"
							trailingButton={{
								label: copied ? "Copiado" : "Copiar",
								icon: copied ? Check : Copy01,
								onClick: async () => {
									await navigator.clipboard.writeText(link);
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
								},
							}}
						/>
					) : null}
					{p.noLinkReason ? <p className="text-sm text-tertiary">{p.noLinkReason}</p> : null}
				</div>
			) : null}
			<AssetFooter file={p.file}>
				<Button
					hierarchy="secondary"
					size="sm"
					iconLeading={Download01}
					loading={busy}
					aria-label={`Descargar el panel ${p.title}`}
					onClick={onExport}
				>
					Descargar
				</Button>
			</AssetFooter>
		</article>
	);
}
