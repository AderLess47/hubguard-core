/**
 * Verbindungs-State-Machine des Basis-Kerns.
 *
 * Vier Zustände mit festen erlaubten Übergängen; alles andere wirft. Die
 * Machine kennt weder Timer noch Netzwerk — die Plattform-Adapter melden
 * Ergebnisse, der Kern hält nur den Zustand und benachrichtigt Abonnenten.
 */

export const CONNECTION_STATES = ["DISCONNECTED", "CONNECTING", "CONNECTED", "RECONNECTING"] as const;

export type ConnectionState = (typeof CONNECTION_STATES)[number];

const UEBERGAENGE: Readonly<Record<ConnectionState, readonly ConnectionState[]>> = Object.freeze({
  DISCONNECTED: ["CONNECTING"],
  CONNECTING: ["CONNECTED", "DISCONNECTED"],
  CONNECTED: ["RECONNECTING", "DISCONNECTED"],
  RECONNECTING: ["CONNECTED", "DISCONNECTED"],
});

export type StateListener = (state: ConnectionState, previous: ConnectionState) => void;

export class ConnectionStateMachine {
  private current: ConnectionState = "DISCONNECTED";
  private readonly listeners = new Set<StateListener>();

  get state(): ConnectionState {
    return this.current;
  }

  canTransitionTo(next: ConnectionState): boolean {
    return UEBERGAENGE[this.current].includes(next);
  }

  transitionTo(next: ConnectionState): ConnectionState {
    if (!this.canTransitionTo(next)) {
      throw new Error(`Übergang ${this.current} → ${next} ist nicht erlaubt`);
    }
    const previous = this.current;
    this.current = next;
    for (const listener of [...this.listeners]) listener(next, previous);
    return this.current;
  }

  /** Meldet jede Zustandsänderung; die Rückgabe meldet den Listener wieder ab. */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Verbindungsabbau: führt aus jedem Zustand zurück nach `DISCONNECTED`. */
  disconnect(): ConnectionState {
    if (this.current === "DISCONNECTED") return this.current;
    return this.transitionTo("DISCONNECTED");
  }
}
