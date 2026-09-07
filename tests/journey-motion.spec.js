import { test, expect } from '@playwright/test';
import { journeyMotion, JOURNEY_DURATION, GATE_TIMES, TAIL_CLEAR_DELAY, RETURN_START } from '../src/effects/journey-motion.js';
const at = seconds => journeyMotion(seconds / JOURNEY_DURATION);

test('each gate has a low cruise, rising turn, full passage and recovery', () => {
  for (const [index, center] of GATE_TIMES.entries()) {
    const before = at(center - 3.5);
    const climbing = at(center - 2);
    const crossing = at(center);
    const after = at(center + 4.5);
    expect(before.y).toBeGreaterThan(.60);
    expect(climbing.y).toBeLessThan(before.y);
    expect(climbing.rotation).toBeLessThan(-8);
    expect(climbing.bend).toBeGreaterThan(.1);
    expect(climbing.effort).toBeGreaterThan(before.effort);
    expect(Math.abs(climbing.bank)).toBeGreaterThan(1);
    expect(climbing.wake).toBeGreaterThan(before.wake);
    expect(crossing.y).toBeCloseTo(.48);
    if (index < 2) expect(after.y).toBeGreaterThan(.60);
    else expect(after.y).toBeLessThan(.5);
    expect(at(center + TAIL_CLEAR_DELAY - .01).gates[index].opacity).toBe(1);
    expect(at(center + TAIL_CLEAR_DELAY - .01).passed).toBe(index);
    expect(at(center + TAIL_CLEAR_DELAY + .1).passed).toBe(index + 1);
    expect(at(center + TAIL_CLEAR_DELAY + 1).gates[index].opacity).toBeLessThan(1);
  }
});

test('last gate keeps travelling, then clears before the final return', () => {
  const lastGate = GATE_TIMES.at(-1);
  const during = at(lastGate + 1);
  const clear = at(RETURN_START);
  expect(clear.gates[2].x).toBeLessThan(during.gates[2].x);
  expect(during.gates[2].opacity).toBe(1);
  expect(during.returning).toBe(0);
  expect(at(JOURNEY_DURATION).gates[2].opacity).toBe(0);
  expect(at(RETURN_START).returning).toBe(0);
  expect(at(RETURN_START + .1).returning).toBeGreaterThan(0);
  expect(at(RETURN_START + 1).y).toBeLessThan(.5);
  expect(JOURNEY_DURATION).toBe(27);
  expect(at(JOURNEY_DURATION).returning).toBe(1);
  const end = at(JOURNEY_DURATION);
  expect(end).toMatchObject({ x: .55, y: .49, scale: 1, rotation: -9, passed: 3 });
});

test('path is continuous across all phase boundaries', () => {
  for (let t = .01; t <= JOURNEY_DURATION; t += .01) {
    const a = at(t - .01), b = at(t);
    expect(Math.abs(a.y - b.y)).toBeLessThan(.003);
    expect(Math.abs(a.rotation - b.rotation)).toBeLessThan(1);
    expect(Math.abs(a.bend - b.bend)).toBeLessThan(.04);
    expect(Math.abs(a.bank - b.bank)).toBeLessThan(.5);
    expect(Math.abs(a.effort - b.effort)).toBeLessThan(.04);
  }
});

test('memories recall in sequence without changing gate timing', () => {
  GATE_TIMES.forEach((center, index) => {
    const emerging = at(center - 3).gates[index].recall;
    expect(emerging[0]).toBeGreaterThan(emerging[1]);
    expect(emerging[1]).toBeGreaterThan(emerging[2]);
    expect(emerging[2]).toBeGreaterThan(emerging[3]);
    expect(at(center).gates[index].recall).toEqual([1, 1, 1, 1]);
  });
});
