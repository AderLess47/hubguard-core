import { describe, expect, it } from "vitest";
import { CURVE25519_KEY_BYTES, fromBase64, generateCurve25519KeyPair, isCurve25519Key } from "./keys";

describe("generateCurve25519KeyPair", () => {
  it("erzeugt private und öffentliche Schlüssel als Base64", async () => {
    const paar = await generateCurve25519KeyPair();
    expect(fromBase64(paar.privateKey)).toHaveLength(CURVE25519_KEY_BYTES);
    expect(fromBase64(paar.publicKey)).toHaveLength(CURVE25519_KEY_BYTES);
    expect(paar.publicKey).not.toBe(paar.privateKey);
  });

  it("erzeugt bei jedem Aufruf ein anderes Paar", async () => {
    const [erstes, zweites] = await Promise.all([generateCurve25519KeyPair(), generateCurve25519KeyPair()]);
    expect(erstes.privateKey).not.toBe(zweites.privateKey);
    expect(erstes.publicKey).not.toBe(zweites.publicKey);
  });

  it("erkennt Felder mit falscher Länge", async () => {
    const paar = await generateCurve25519KeyPair();
    expect(isCurve25519Key(paar.publicKey)).toBe(true);
    expect(isCurve25519Key("AAAA")).toBe(false);
    expect(isCurve25519Key("")).toBe(false);
  });
});
