/**
 * Lokale Curve25519-Erzeugung des Basis-Kerns.
 *
 * Der private Schlüssel entsteht auf dem Gerät und verlässt es nie; das
 * Backend bekommt ausschließlich den öffentlichen Schlüssel als Base64.
 * Es gibt genau eine Zufallsquelle (`crypto.getRandomValues` über WebCrypto)
 * und keine weitere Ableitung.
 */

export const CURVE25519_KEY_BYTES = 32;

export interface Curve25519KeyPair {
  /** Base64 des privaten Schlüssels — bleibt auf dem Gerät. */
  privateKey: string;
  /** Base64 des öffentlichen Schlüssels — der einzige Wert für das Backend. */
  publicKey: string;
}

/** JWK transportiert Base64url; nach außen gilt überall Base64. */
function base64urlToBase64(value: string): string {
  const ersetzt = value.replace(/-/g, "+").replace(/_/g, "/");
  const fehlend = (4 - (ersetzt.length % 4)) % 4;
  return ersetzt.padEnd(ersetzt.length + fehlend, "=");
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Prüft ein Base64-Feld auf die Länge eines Curve25519-Schlüssels. */
export function isCurve25519Key(value: string): boolean {
  try {
    return fromBase64(value).length === CURVE25519_KEY_BYTES;
  } catch {
    return false;
  }
}

/** Erzeugt ein Curve25519-Schlüsselpaar im aktuellen Kontext. */
export async function generateCurve25519KeyPair(): Promise<Curve25519KeyPair> {
  const erzeugt = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]);
  if (!("privateKey" in erzeugt)) throw new Error("Curve25519-Erzeugung lieferte kein Schlüsselpaar");
  const privat = await crypto.subtle.exportKey("jwk", erzeugt.privateKey);
  const oeffentlich = await crypto.subtle.exportKey("jwk", erzeugt.publicKey);
  if (!privat.d || !oeffentlich.x) {
    throw new Error("Curve25519-Export enthält kein Schlüsselmaterial");
  }
  return {
    privateKey: base64urlToBase64(privat.d),
    publicKey: base64urlToBase64(oeffentlich.x),
  };
}
