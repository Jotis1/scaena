// Prohíbe colores hex, colores escritos como función y la paleta cruda de Tailwind en el código de Scaena:
// todo color sale de un token semántico de Regula (guía, «Con Tailwind v4»). Adaptado de
// regula/packages/react/scripts/check-colors.ts. Uso: bun run scripts/check-colors.ts app components lib
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Ficheros con colores fijos justificados. Cada excepción lleva su motivo. */
export const ALLOWED: Record<string, string> = {};

const PALETTE =
	"slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PREFIX =
	"bg|text|border|border-[trblxy]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|shadow|decoration|accent|caret";
// `bg-indigo-600`, `hover:text-gray-500/50`; no `bg-utility-neutral-300`, que es un token
const RAW_UTILITY = new RegExp(
	String.raw`(?<![\w-])(?:[\w-]+:)*(?:${PREFIX})-(?:(?:${PALETTE})-\d{2,3}|white|black)(?:\/\d+)?(?![\w-])`,
	"g",
);
const HEX = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;
// Colores escritos como función: también cuentan, para que no se cuelen como `rgb(…)`
const FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.]/gi;
// `text-white` y `fg-white` son tokens de la guía, no paleta cruda
const TOKENS = new Set(["text-white", "text-fg-white"]);
/** Excepción de una línea con su motivo: `// color-fijo: <motivo>` en la línea anterior. */
const EXCEPTION = /(?:\/\/|\/\*)\s*color-fijo:\s*\S/;

export type FindingKind = "hex" | "palette" | "function";

export interface Finding {
	line: number;
	match: string;
	kind: FindingKind;
}

const LABELS: Record<FindingKind, string> = {
	hex: "color hex",
	function: "color en función",
	palette: "paleta cruda",
};

export function findRawColors(code: string): Finding[] {
	const out: Finding[] = [];
	const lines = code.split("\n");
	lines.forEach((line, i) => {
		if (i > 0 && EXCEPTION.test(lines[i - 1] as string)) return;
		for (const m of line.matchAll(HEX)) out.push({ line: i + 1, match: m[0], kind: "hex" });
		for (const m of line.matchAll(FUNCTION)) out.push({ line: i + 1, match: m[0], kind: "function" });
		for (const m of line.matchAll(RAW_UTILITY))
			if (!TOKENS.has(m[0].split(":").at(-1) as string))
				out.push({ line: i + 1, match: m[0], kind: "palette" });
	});
	return out;
}

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		// Código generado (cliente de Prisma): no lo escribimos nosotros.
		if (statSync(p).isDirectory()) return f === "generated" ? [] : files(p);
		// Los tests pueden escribir colores a propósito, para comprobar justo esto.
		return /\.(tsx?|css)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
	});
}

export function checkDirs(dirs: string[], root = process.cwd()): string[] {
	const problems: string[] = [];
	for (const dir of dirs) {
		const abs = join(root, dir);
		if (!existsSync(abs)) continue;
		for (const file of files(abs)) {
			const rel = relative(root, file).split(sep).join("/");
			if (rel in ALLOWED) continue;
			for (const f of findRawColors(readFileSync(file, "utf8")))
				problems.push(`${rel}:${f.line} ${LABELS[f.kind]} «${f.match}»: usa un token semántico`);
		}
	}
	return problems;
}

if (import.meta.main) {
	const dirs = process.argv.slice(2);
	const problems = checkDirs(dirs.length ? dirs : ["app", "components", "lib"]);
	for (const p of problems) console.error(p);
	if (problems.length) {
		console.error(`\n${problems.length} colores fuera de los tokens.`);
		process.exit(1);
	}
	console.log("Sin colores fuera de los tokens.");
}
