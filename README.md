# hubguard-core

Minimaler, öffentlich auditierbarer Basis-Client des HubGuard-VPN.

## Umfang

- Standard-WireGuard-Konfiguration für das Interface `wg0` (`buildWireGuardClientConfig`)
- lokale Curve25519-Schlüsselerzeugung (`generateCurve25519KeyPair`) — der private
  Schlüssel entsteht auf dem Gerät und verlässt es nie
- Verbindungs-State-Machine mit `DISCONNECTED`, `CONNECTING`, `CONNECTED`,
  `RECONNECTING` (`ConnectionStateMachine`)

Der Kern ist absichtlich klein: keine Netzwerk-, Server- oder Härtungskonfiguration,
keine Zeitpläne, keine Hintergrunddienste. Tunnel-Adresse, Endpunkt und
Server-Public-Key werden zur Laufzeit nach der Anmeldung übergeben; im Code
stehen sie nicht.

## Keine Platzhalter für interne Systeme

Der Kern enthält weder Schnittstellen noch Typen noch Stubs für Komponenten, die
ausschließlich im privaten Repository liegen. Wer den Kern erweitert, hält diese
Grenze ein: Der Export des Repositories bricht ab, sobald solche Begriffe oder
Pfade darin auftauchen.

## Offizieller Release-Build

Der offizielle Release-Build ergänzt zusätzliche proprietäre Schutz- und
Anti-Korrelations-Module aus dem privaten Repository. Dieses Paket ist der
Basis-Teil davon und für sich lauffähig.

## Nutzung

```ts
import { ConnectionStateMachine, buildWireGuardClientConfig, generateCurve25519KeyPair } from "hubguard-core";

const paar = await generateCurve25519KeyPair();
const conf = buildWireGuardClientConfig({
  privateKey: paar.privateKey,
  address: "192.0.2.10/32",
  dns: "192.0.2.53",
  peer: {
    publicKey: "<server-public-key>",
    endpoint: "vpn.example.net:51820",
    allowedIps: ["0.0.0.0/0", "::/0"],
  },
});

const machine = new ConnectionStateMachine();
machine.transitionTo("CONNECTING");
```

## Tests

```bash
bunx vitest run                 # Tests
bunx tsc -p tsconfig.json --noEmit   # Typen
```

Die Tests liegen neben dem Code und werden mit exportiert.
