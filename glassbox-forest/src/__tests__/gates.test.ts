// Structural gate enforcement: every gated seam is built UP TO the gate and REFUSES without a token.
// The client can never grant a gate (fail-closed), and there is no code path to grant one.
import { describe, test, expect } from 'vitest';
import { requireGate, isGranted, GateError, GATES, type GateId } from '../governance/gates';
import { redeemSparks, isRedemptionOpen, VALUE_MODEL } from '../economy/redemption';
import { startSpotlightSession } from '../multiplayer/socialWitness';
import { RemoteDbPersistence, LocalStoragePersistence, selectPersistence } from '../persistence/adapter';

describe('gate enforcement (fail-closed)', () => {
  test('no gate is ever granted client-side', () => {
    for (const id of Object.keys(GATES) as GateId[]) expect(isGranted(id)).toBe(false);
  });
  test('requireGate throws a GateError with an escalation for every gate', () => {
    for (const id of Object.keys(GATES) as GateId[]) {
      try { requireGate(id); throw new Error('should have thrown'); }
      catch (e) {
        expect(e).toBeInstanceOf(GateError);
        expect((e as GateError).escalation).toContain('ESCALATION');
        expect((e as GateError).escalation).toContain(GATES[id].token);
      }
    }
  });
});

describe('G1 seam — redemption refuses; value model stays closed-loop', () => {
  test('redeemSparks throws GateError(G1) and redemption is never open', () => {
    expect(() => redeemSparks({ userId: 'u1', sparks: 100 })).toThrow(GateError);
    expect(isRedemptionOpen()).toBe(false);
    expect(VALUE_MODEL).toBe('closed-loop');
  });
});

describe('G2 seam — multiplayer spotlight refuses', () => {
  test('startSpotlightSession throws GateError(G2)', () => {
    try { startSpotlightSession('hold-crown', 'u1'); throw new Error('should have thrown'); }
    catch (e) { expect(e).toBeInstanceOf(GateError); expect((e as GateError).gate).toBe('G2_DEPLOY'); }
  });
});

describe('G3 seam — real DB refuses; app stays local', () => {
  test('RemoteDbPersistence.connect throws GateError(G3); selectPersistence is local', () => {
    try { new RemoteDbPersistence().connect(); throw new Error('should have thrown'); }
    catch (e) { expect(e).toBeInstanceOf(GateError); expect((e as GateError).gate).toBe('G3_SECRETS'); }
    expect(selectPersistence()).toBeInstanceOf(LocalStoragePersistence);
    expect(selectPersistence().kind).toBe('localStorage');
  });
});
