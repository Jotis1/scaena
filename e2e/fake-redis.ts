// Upstash Redis falso para Playwright: habla el mismo REST (POST con el comando en JSON) y guarda todo en
// memoria. Solo los comandos que usa Scaena. Lo arranca playwright.config.ts; los tests siembran datos con
// `redis()` de e2e/redis.ts. `FLUSHALL` lo vacía.
import { createServer } from "node:http";

import { FAKE_REDIS_PORT } from "./ports";

type Value = { value: string; expiresAt?: number };
const strings = new Map<string, Value>();
const hashes = new Map<string, Map<string, string>>();
const streams = new Map<string, { id: string; fields: string[] }[]>();

const parts = (id: string) => id.split("-").map(Number) as [number, number];
const cmp = (a: string, b: string) => {
	const [am, as] = parts(a);
	const [bm, bs] = parts(b);
	return am - bm || as - bs;
};

function alive(key: string): Value | undefined {
	const v = strings.get(key);
	if (v?.expiresAt !== undefined && v.expiresAt <= Date.now()) strings.delete(key);
	return strings.get(key);
}

function run(cmd: string[]): unknown {
	const [name = "", ...a] = cmd;
	const key = a[0] as string;
	switch (name.toUpperCase()) {
		case "PING":
			return "PONG";
		case "FLUSHALL":
			strings.clear();
			hashes.clear();
			streams.clear();
			return "OK";
		case "GET":
			return alive(key)?.value ?? null;
		case "SET": {
			const opts = a.slice(2).map((x) => String(x).toLowerCase());
			if (opts.includes("nx") && alive(key)) return null;
			const ex = opts.indexOf("ex");
			strings.set(key, {
				value: String(a[1]),
				expiresAt: ex >= 0 ? Date.now() + Number(opts[ex + 1]) * 1000 : undefined,
			});
			return "OK";
		}
		case "DEL": {
			let n = 0;
			for (const k of a) n += Number(strings.delete(k) || hashes.delete(k) || streams.delete(k));
			return n;
		}
		case "HSET": {
			const h = hashes.get(key) ?? new Map();
			for (let i = 1; i < a.length; i += 2) h.set(String(a[i]), String(a[i + 1]));
			hashes.set(key, h);
			return (a.length - 1) / 2;
		}
		case "HGETALL":
			return [...(hashes.get(key) ?? new Map()).entries()].flat();
		case "XADD": {
			let i = 1;
			let minId: string | undefined;
			if (String(a[i]).toUpperCase() === "MINID") {
				minId = String(a[i + 2]);
				i += 3;
			}
			i++; // `*`
			const list = streams.get(key) ?? [];
			const last = list.at(-1);
			const ms = Date.now();
			const [lm, ls] = last ? parts(last.id) : [-1, -1];
			const id = ms > lm ? `${ms}-0` : `${lm}-${ls + 1}`;
			list.push({ id, fields: a.slice(i).map(String) });
			streams.set(key, minId ? list.filter((e) => cmp(e.id, minId) >= 0) : list);
			return id;
		}
		case "XRANGE": {
			const [, start = "-", end = "+", count, n] = a;
			const exclusive = start.startsWith("(");
			const from = exclusive ? start.slice(1) : start;
			let list = (streams.get(key) ?? []).filter((e) => {
				if (from !== "-" && (exclusive ? cmp(e.id, from) <= 0 : cmp(e.id, from) < 0)) return false;
				return end === "+" || cmp(e.id, end) <= 0;
			});
			if (String(count).toUpperCase() === "COUNT") list = list.slice(0, Number(n));
			return list.map((e) => [e.id, e.fields]);
		}
		default:
			throw new Error(`Comando no soportado por el Redis falso: ${name}`);
	}
}

const encode = (v: unknown): unknown =>
	typeof v === "string"
		? v === "OK"
			? v
			: Buffer.from(v).toString("base64")
		: Array.isArray(v)
			? v.map(encode)
			: v;

createServer((req, res) => {
	let body = "";
	req.on("data", (c) => {
		body += c;
	});
	req.on("end", () => {
		const base64 = req.headers["upstash-encoding"] === "base64";
		const send = (status: number, json: unknown) => {
			res.writeHead(status, { "content-type": "application/json" });
			res.end(JSON.stringify(json));
		};
		try {
			const parsed = JSON.parse(body || "[]");
			if (req.url?.startsWith("/pipeline") || req.url?.startsWith("/multi-exec"))
				return send(
					200,
					(parsed as string[][]).map((c) => ({ result: base64 ? encode(run(c)) : run(c) })),
				);
			const result = run(parsed as string[]);
			send(200, { result: base64 ? encode(result) : result });
		} catch (e) {
			send(400, { error: e instanceof Error ? e.message : String(e) });
		}
	});
}).listen(FAKE_REDIS_PORT, () => console.log(`Redis falso en http://localhost:${FAKE_REDIS_PORT}`));
