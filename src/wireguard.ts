/**
 * Aufbau einer standardkonformen WireGuard-Client-Konfiguration (`wg0`).
 *
 * Enthalten sind ausschließlich die Felder aus `[Interface]` und `[Peer]`.
 * Adresse, Endpunkt und Server-Public-Key werden zur Laufzeit übergeben —
 * sie stehen weder im Code noch in einer Vorgabe.
 */

export const WG_INTERFACE = "wg0";
export const WG_PORT = 51820;

export interface WireGuardPeerConfig {
  publicKey: string;
  /** Erreichbarer Endpunkt als `host:port`. */
  endpoint: string;
  allowedIps: readonly string[];
  persistentKeepalive?: number;
}

export interface WireGuardClientConfig {
  privateKey: string;
  /** Tunnel-Adresse des Geräts, z. B. `192.0.2.10/32`. */
  address: string;
  dns?: string;
  mtu?: number;
  peer: WireGuardPeerConfig;
}

function pflicht(wert: string | undefined, feld: string): string {
  if (typeof wert !== "string" || wert.trim() === "") {
    throw new Error(`Pflichtfeld fehlt: ${feld}`);
  }
  return wert.trim();
}

export function buildWireGuardClientConfig(config: WireGuardClientConfig): string {
  const privateKey = pflicht(config.privateKey, "privateKey");
  const address = pflicht(config.address, "address");
  const peerPublicKey = pflicht(config.peer.publicKey, "peer.publicKey");
  const endpoint = pflicht(config.peer.endpoint, "peer.endpoint");
  if (config.peer.allowedIps.length === 0) {
    throw new Error("Pflichtfeld fehlt: peer.allowedIps");
  }

  const zeilen = ["[Interface]", `PrivateKey = ${privateKey}`, `Address = ${address}`];
  if (config.dns) zeilen.push(`DNS = ${config.dns}`);
  if (config.mtu !== undefined) zeilen.push(`MTU = ${config.mtu}`);

  zeilen.push(
    "",
    "[Peer]",
    `PublicKey = ${peerPublicKey}`,
    `Endpoint = ${endpoint}`,
    `AllowedIPs = ${config.peer.allowedIps.join(", ")}`,
  );
  if (config.peer.persistentKeepalive !== undefined) {
    zeilen.push(`PersistentKeepalive = ${config.peer.persistentKeepalive}`);
  }

  return `${zeilen.join("\n")}\n`;
}
