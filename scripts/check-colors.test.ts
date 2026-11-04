import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkDirs, findRawColors } from "./check-colors";

describe("findRawColors", () => {
	it("detecta la paleta cruda de Tailwind", () => {
		expect(findRawColors('<div className="bg-indigo-600 hover:text-gray-500/50" />')).toEqual([
			{ line: 1, match: "bg-indigo-600", kind: "palette" },
			{ line: 1, match: "hover:text-gray-500/50", kind: "palette" },
		]);
	});

	it("detecta hex y colores en función", () => {
		const found = findRawColors("color: #0a0a0a;\nbackground: rgba(10, 10, 10, 0.78);");
		expect(found.map((f) => f.kind)).toEqual(["hex", "function"]);
	});

	it("no confunde tokens con paleta", () => {
		expect(
			findRawColors('className="bg-primary text-white bg-utility-neutral-300 bg-alpha-black/70"'),
		).toEqual([]);
	});

	it("respeta una excepción con motivo en la línea anterior", () => {
		expect(findRawColors("// color-fijo: máscara de desvanecido\nconst m = '#000';")).toEqual([]);
	});

	it("no admite una excepción sin motivo", () => {
		expect(findRawColors("// color-fijo:\nconst m = '#000';")).toHaveLength(1);
	});
});

describe("checkDirs", () => {
	let root: string;
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("falla con un bg-indigo-600 y pasa sin él", () => {
		root = mkdtempSync(join(tmpdir(), "scaena-colors-"));
		mkdirSync(join(root, "app"));
		writeFileSync(join(root, "app", "page.tsx"), 'export default () => <p className="bg-indigo-600" />;');
		expect(checkDirs(["app", "lib"], root)).toEqual([
			"app/page.tsx:1 paleta cruda «bg-indigo-600»: usa un token semántico",
		]);
		writeFileSync(
			join(root, "app", "page.tsx"),
			'export default () => <p className="bg-brand-solid" />;',
		);
		expect(checkDirs(["app", "lib"], root)).toEqual([]);
	});
});
