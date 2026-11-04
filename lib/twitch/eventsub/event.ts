// Evento de Scaena: lo que viaja de EventSub a los overlays (alertas, eventos recientes y meta). Mismo
// vocabulario que Regula (`StreamEventType`), sin `donation`: Twitch no tiene donaciones nativas.

export type AlertType = "follow" | "sub" | "resub" | "gift" | "raid" | "bits";
export const ALERT_TYPES: readonly AlertType[] = ["follow", "sub", "resub", "gift", "raid", "bits"];

export interface AlertEvent {
	/** Id del mensaje de EventSub: el mismo en los reintentos de Twitch. */
	id: string;
	/** Id de Twitch del canal que recibe el evento. */
	channelId: string;
	type: AlertType;
	/** Nombre visible de quien lo provoca ("Anónimo" si lo es). */
	user: string;
	/** Subs regaladas, espectadores del raid o bits. */
	amount?: number;
	/** Meses acumulados de una renovación. */
	months?: number;
	/** Nivel de la suscripción: 1, 2 o 3 ("Prime" cuenta como 1). */
	tier?: 1 | 2 | 3;
	/** Mensaje del espectador, tal cual: siempre texto plano. */
	message?: string;
	/** Lanzado desde «Alertas de prueba» del estudio. */
	test?: boolean;
	/** Cuándo ocurrió, en milisegundos. */
	ts: number;
}
