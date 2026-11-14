"use client";

import {
	Button,
	CardHeader,
	ChannelBanner,
	ChannelPanel,
	Input,
	PageHeader,
	SectionHeader,
} from "@jotis-me/react";
import { Check, Copy01, Download01, LinkExternal01 } from "@untitledui/icons";
import { zipSync } from "fflate";
import { domToBlob } from "modern-screenshot";
import { useRef, useState } from "react";
import { ThemeMenu } from "@/components/web/ThemeMenu";
import { PROFILE_ICONS } from "@/lib/icons";
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
		<div className="flex flex-col gap-8">
			<PageHeader
				title="Recursos"
				description="El banner y los paneles del perfil de Twitch, listos para subir."
				divider={false}
				actions={
					<div className="flex items-center gap-3">
						<ThemeMenu />
						<Button
							hierarchy="primary"
							size="md"
							iconLeading={Download01}
							loading={busy === "all"}
							onClick={exportAll}
						>
							Exportar todo
						</Button>
					</div>
				}
			/>
			{error ? (
				<p role="alert" className="text-sm text-error-primary">
					{error}
				</p>
			) : null}

			<section
				aria-label="Banner"
				className="overflow-hidden rounded-xl border border-secondary bg-primary"
			>
				<CardHeader
					title="Banner del perfil"
					badge="1200 × 480"
					badgeColor="gray"
					description="El lema y el horario habitual. Twitch lo recorta en móvil; el texto ya queda dentro de la zona segura."
					actions={
						<Button
							hierarchy="secondary"
							size="sm"
							iconLeading={Download01}
							loading={busy === banner.file}
							onClick={() => exportOne(banner.file)}
						>
							Exportar PNG
						</Button>
					}
				/>
				<div className="px-6 pt-5 pb-6">
					<div className="h-60 w-150 max-w-full overflow-hidden rounded-lg">
						<Banner b={banner} scale={0.5} />
					</div>
				</div>
			</section>

			<SectionHeader
				title="Paneles"
				description="320 px de ancho. Se exportan a 640 px para que se vean nítidos."
				divider={false}
			/>
			<div className="grid grid-cols-[repeat(auto-fill,320px)] gap-x-6 gap-y-8">
				{panels.map((p) => (
					<PanelItem key={p.slug} p={p} onExport={() => exportOne(p.file)} busy={busy === p.file} />
				))}
			</div>

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

/** Un panel tal como se verá en Twitch, su enlace (si lleva) para copiar, su nota y «Exportar PNG». */
function PanelItem({ p, onExport, busy }: { p: PanelData; onExport: () => void; busy: boolean }) {
	const [copied, setCopied] = useState(false);
	const link = p.action?.href;
	return (
		<section aria-label={`Panel ${p.title}`} className="flex flex-col gap-3">
			<div data-panel={p.slug}>
				<Panel p={p} />
			</div>
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
			<Button
				hierarchy="secondary"
				size="sm"
				iconLeading={Download01}
				loading={busy}
				onClick={onExport}
				className="self-start"
			>
				Exportar PNG
			</Button>
		</section>
	);
}
