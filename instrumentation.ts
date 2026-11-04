// Se ejecuta una vez al arrancar el servidor de Next (no al construir). La comprobación vive en un
// módulo aparte que solo se carga en Node: este fichero también se compila para el runtime Edge.
export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
