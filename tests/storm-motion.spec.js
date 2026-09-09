import { test, expect } from '@playwright/test';
import {
  STORM_DURATION,
  STORM_OBSTACLES,
  stormMotion,
} from '../src/effects/storm-motion.js';

test('cá voi tiến lên rồi bị đẩy lùi ba lần trước khi family xuất hiện', () => {
  const attempts = [
    [0, .12, .2],
    [.2, .3, .38],
    [.38, .47, .54],
  ];
  attempts.forEach(([start, hit, recoil], index) => {
    const from = stormMotion(start).whale;
    const collision = stormMotion(hit).whale;
    const pushedBack = stormMotion(recoil).whale;
    expect(collision.x).toBeGreaterThan(from.x + .14);
    expect(collision.y).toBeLessThan(from.y - .1);
    expect(pushedBack.x).toBeLessThan(collision.x - .13);
    expect(pushedBack.y).toBeGreaterThan(collision.y + .09);
    expect(stormMotion(hit).obstacles[index].state).toBe('impact');
    expect(stormMotion(hit).impact).toBeGreaterThan(.95);
  });
});

test('quỹ đạo bão liên tục qua mọi mốc tiến, va chạm và lùi', () => {
  let previous = stormMotion(0);
  for (let progress = .001; progress <= 1; progress += .001) {
    const current = stormMotion(progress);
    expect(Math.abs(current.whale.x - previous.whale.x)).toBeLessThan(.008);
    expect(Math.abs(current.whale.y - previous.whale.y)).toBeLessThan(.008);
    expect(Math.abs(current.whale.scale - previous.whale.scale)).toBeLessThan(.009);
    expect(Math.abs(current.whale.rotation - previous.whale.rotation)).toBeLessThan(1.2);
    previous = current;
  }
});

test('cá voi giữ đà liên tục trong pha Family cùng bứt phá', () => {
  [.71, .77, .83].forEach((progress) => {
    const before = stormMotion(progress - .004).whale;
    const after = stormMotion(progress + .004).whale;
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(.003);
  });
});

test('vật cản trôi ngược chiều, chặn đường rồi bị cả đàn đánh bật khỏi khung', () => {
  expect(STORM_OBSTACLES).toHaveLength(6);
  STORM_OBSTACLES.forEach((definition, index) => {
    const approaching = stormMotion(Math.max(0, definition.impact - .07)).obstacles[index];
    const blocked = stormMotion(definition.impact + .05).obstacles[index];
    const expelled = stormMotion(1).obstacles[index];
    expect(approaching.x).toBeGreaterThan(blocked.x);
    expect(blocked.state).toBe('blocked');
    expect(expelled.state).toBe('expelled');
    expect(expelled.x < -.05 || expelled.x > 1.05 || expelled.y < -.05 || expelled.y > 1.05).toBe(true);
    expect(expelled.opacity).toBeLessThan(.05);
  });
});

test('chín cá voi con hội tụ quanh cá voi lớn rồi cùng tiến tới vùng sáng', () => {
  expect(stormMotion(.5).companions.every(companion => companion.opacity === 0)).toBe(true);
  const assembled = stormMotion(.64);
  expect(assembled.phase).toBe('breakthrough');
  expect(assembled.companions).toHaveLength(9);
  expect(assembled.companions.every(companion => companion.arrival > .92)).toBe(true);
  expect(assembled.companions.some(companion => companion.x < assembled.whale.x)).toBe(true);
  expect(assembled.companions.some(companion => companion.x > assembled.whale.x)).toBe(true);
  expect(assembled.companions.some(companion => companion.y < assembled.whale.y)).toBe(true);
  expect(assembled.companions.some(companion => companion.y > assembled.whale.y)).toBe(true);
  const destination = stormMotion(.88);
  expect(destination.whale.x).toBeGreaterThan(assembled.whale.x + .4);
  expect(destination.whale.y).toBeLessThan(assembled.whale.y - .4);
  expect(destination.breakthrough).toBeGreaterThan(.95);
});

test('ánh sáng chỉ phủ màn hình sau khi cả đàn tới đích', () => {
  expect(STORM_DURATION).toBe(14);
  expect(stormMotion(.87).light.wipe).toBe(0);
  expect(stormMotion(.88).phase).toBe('light-wipe');
  expect(stormMotion(.94).light.wipe).toBeGreaterThan(.45);
  const end = stormMotion(1);
  expect(end.light.wipe).toBe(1);
  expect(end.light.radius).toBe(175);
  expect(end.storm.clear).toBe(1);
  expect(end.whale.opacity).toBeLessThan(.2);
});

test('mobile giữ hành trình trong vùng an toàn và cùng nhịp kể chuyện', () => {
  const start = stormMotion(0, { mobile: true });
  const family = stormMotion(.64, { mobile: true });
  const destination = stormMotion(.88, { mobile: true });
  expect(start.whale).toMatchObject({ x: .23, y: .79, scale: .48 });
  expect(family.phase).toBe('breakthrough');
  expect(destination.whale.x).toBeCloseTo(.7);
  expect(destination.whale.y).toBeCloseTo(.22);
  expect(destination.light).toMatchObject({ x: 76, y: 10 });
});
