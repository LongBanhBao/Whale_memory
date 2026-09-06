import { test, expect } from '@playwright/test';
import { journeyMotion, JOURNEY_DURATION, GATE_TIMES, TAIL_CLEAR_DELAY } from '../src/effects/journey-motion.js';
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
    expect(crossing.y).toBeCloseTo(.48);
    expect(after.y).toBeGreaterThan(.60);
    expect(at(center + TAIL_CLEAR_DELAY - .01).gates[index].opacity).toBe(1);
    expect(at(center + TAIL_CLEAR_DELAY - .01).passed).toBe(index);
    expect(at(center + TAIL_CLEAR_DELAY + .1).passed).toBe(index + 1);
    expect(at(center + TAIL_CLEAR_DELAY + 1).gates[index].opacity).toBeLessThan(1);
  }
});

test('last gate keeps travelling, then clears before the final return', () => {
  const during = at(26);
  const clear = at(27.6);
  expect(clear.gates[2].x).toBeLessThan(during.gates[2].x);
  expect(during.gates[2].opacity).toBe(1);
  expect(during.returning).toBe(0);
  expect(at(30).gates[2].opacity).toBe(0);
  expect(at(30).returning).toBe(0);
  const end = at(JOURNEY_DURATION);
  expect(end).toMatchObject({ x: .55, y: .49, scale: 1, rotation: -9, passed: 3 });
});

test('path is continuous across all phase boundaries', () => {
  for (let t = .01; t <= JOURNEY_DURATION; t += .01) {
    const a = at(t - .01), b = at(t);
    expect(Math.abs(a.y - b.y)).toBeLessThan(.003);
    expect(Math.abs(a.rotation - b.rotation)).toBeLessThan(1);
    expect(Math.abs(a.bend - b.bend)).toBeLessThan(.04);
  }
});
