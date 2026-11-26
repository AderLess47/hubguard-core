import { describe, expect, it } from "vitest";
import { buildWireGuardClientConfig, WG_INTERFACE, WG_PORT } from "./wireguard";
import type { WireGuardClientConfig } from "./wireguard";

function konfiguration(overrides: Partial<WireGuardClientConfig> = {}): WireGuardClientConfig {
  return {
    privateKey: "cHJpdmF0ZS1rZXk=",
    address: "192.0.2.10/32",
    peer: {
      publicKey: "c2VydmVyLWtleQ==",
      endpoint: "198.51.100.7:51820",
      allowedIps: ["0.0.0.0/0", "::/0"],
    },
    ...overrides,
  };
}

describe("buildWireGuardClientConfig", () => {
  it("baut Interface und Peer mit den Standardwerten", () => {
    const conf = buildWireGuardClientConfig(
      konfiguration({ dns: "192.0.2.53", mtu: 1420, peer: { ...konfiguration().peer, persistentKeepalive: 25 } }),
    );

    expect(WG_INTERFACE).toBe("wg0");
    expect(WG_PORT).toBe(51820);
    expect(conf).toContain("[Interface]");
    expect(conf).toContain("Address = 192.0.2.10/32");
    expect(conf).toContain("DNS = 192.0.2.53");
    expect(conf).toContain("MTU = 1420");
    expect(conf).toContain(`Endpoint = 198.51.100.7:${WG_PORT}`);
    expect(conf).toContain("AllowedIPs = 0.0.0.0/0, ::/0");
    expect(conf).toContain("PersistentKeepalive = 25");
  });

  it("lässt optionale Zeilen weg", () => {
    const conf = buildWireGuardClientConfig(konfiguration());
    expect(conf).not.toContain("DNS =");
    expect(conf).not.toContain("MTU =");
    expect(conf).not.toContain("PersistentKeepalive =");
  });

  it("schreibt ausschließlich Standardfelder", () => {
    const conf = buildWireGuardClientConfig(konfiguration({ dns: "192.0.2.53", mtu: 1280 }));
    const felder = conf
      .split("\n")
      .filter((zeile) => zeile.includes(" = "))
      .map((zeile) => zeile.split(" = ")[0]);
    expect(felder).toEqual(["PrivateKey", "Address", "DNS", "MTU", "PublicKey", "Endpoint", "AllowedIPs"]);
  });

  it("verlangt Adresse, Schlüssel und Endpunkt", () => {
    for (const feld of ["privateKey", "address"] as const) {
      expect(() => buildWireGuardClientConfig(konfiguration({ [feld]: "" }))).toThrow(/Pflichtfeld/);
    }
    for (const feld of ["publicKey", "endpoint"] as const) {
      const kaputt = konfiguration();
      expect(() => buildWireGuardClientConfig({ ...kaputt, peer: { ...kaputt.peer, [feld]: " " } })).toThrow(
        /Pflichtfeld/,
      );
    }
  });

  it("verlangt mindestens ein AllowedIPs-Ziel", () => {
    const kaputt = konfiguration();
    expect(() => buildWireGuardClientConfig({ ...kaputt, peer: { ...kaputt.peer, allowedIps: [] } })).toThrow(
      /allowedIps/,
    );
  });
});
