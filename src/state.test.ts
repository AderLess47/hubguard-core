import { describe, expect, it, vi } from "vitest";
import { CONNECTION_STATES, ConnectionStateMachine } from "./state";

describe("ConnectionStateMachine", () => {
  it("startet getrennt und kennt genau vier Zustände", () => {
    expect(new ConnectionStateMachine().state).toBe("DISCONNECTED");
    expect([...CONNECTION_STATES]).toEqual(["DISCONNECTED", "CONNECTING", "CONNECTED", "RECONNECTING"]);
  });

  it("verbindet über CONNECTING nach CONNECTED", () => {
    const machine = new ConnectionStateMachine();
    expect(machine.transitionTo("CONNECTING")).toBe("CONNECTING");
    expect(machine.transitionTo("CONNECTED")).toBe("CONNECTED");
  });

  it("erlaubt den Weg zurück über RECONNECTING", () => {
    const machine = new ConnectionStateMachine();
    machine.transitionTo("CONNECTING");
    machine.transitionTo("CONNECTED");
    expect(machine.transitionTo("RECONNECTING")).toBe("RECONNECTING");
    expect(machine.transitionTo("CONNECTED")).toBe("CONNECTED");
  });

  it("lehnt unerlaubte Sprünge ab und lässt den Zustand stehen", () => {
    const machine = new ConnectionStateMachine();
    expect(machine.canTransitionTo("CONNECTED")).toBe(false);
    expect(() => machine.transitionTo("CONNECTED")).toThrow(/nicht erlaubt/);
    expect(machine.state).toBe("DISCONNECTED");
  });

  it("bricht aus jedem Zustand nach DISCONNECTED ab", () => {
    const machine = new ConnectionStateMachine();
    machine.transitionTo("CONNECTING");
    machine.transitionTo("CONNECTED");
    expect(machine.disconnect()).toBe("DISCONNECTED");
    expect(machine.disconnect()).toBe("DISCONNECTED");
  });

  it("meldet Wechsel an Abonnenten und meldet sie wieder ab", () => {
    const machine = new ConnectionStateMachine();
    const listener = vi.fn();
    const abmelden = machine.subscribe(listener);

    machine.transitionTo("CONNECTING");
    expect(listener).toHaveBeenCalledWith("CONNECTING", "DISCONNECTED");

    abmelden();
    machine.disconnect();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
