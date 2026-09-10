import { test, expect } from '@playwright/test';
import {
  STORM_COMPANION_COUNT,
  STORM_DURATION,
  STORM_MOBILE_COMPANION_COUNT,
  STORM_OBSTACLES,
  STORM_PHASES,
  stormMotion,
} from '../src/effects/storm-motion.js';

test('nhịp kể cảnh bão đủ chậm để người xem theo dõi từng chặng', () => {
  expect(STORM_DURATION).toBe(24);

  const durationOf = ([start, end]) => (end - start) * STORM_DURATION;
  expect(durationOf(STORM_PHASES.ENTRY)).toBeGreaterThanOrEqual(1.8);
  expect(durationOf(STORM_PHASES.STRUGGLE_ONE)).toBeGreaterThanOrEqual(3.4);
  expect(durationOf(STORM_PHASES.STRUGGLE_TWO)).toBeGreaterThanOrEqual(3.4);
  expect(durationOf(STORM_PHASES.STRUGGLE_THREE)).toBeGreaterThanOrEqual(3.5);
  expect(durationOf(STORM_PHASES.FATIGUE) + durationOf(STORM_PHASES.FAMILY_ARRIVAL))
    .toBeGreaterThanOrEqual(3.8);
  expect(durationOf(STORM_PHASES.BREAKTHROUGH)).toBeGreaterThanOrEqual(5);
  expect(durationOf(STORM_PHASES.LIGHT_WIPE)).toBeGreaterThanOrEqual(1.2);
});

test('cá voi tiến lên rồi bị đẩy lùi ba lần trước khi family xuất hiện', () => {
  const attempts = [
    [STORM_PHASES.STRUGGLE_ONE[0], .155, STORM_PHASES.STRUGGLE_ONE[1]],
    [STORM_PHASES.STRUGGLE_TWO[0], .3, STORM_PHASES.STRUGGLE_TWO[1]],
    [STORM_PHASES.STRUGGLE_THREE[0], .445, STORM_PHASES.STRUGGLE_THREE[1]],
  ];

  attempts.forEach(([start, hit, recoil], index) => {
    const from = stormMotion(start).whale;
    const collision = stormMotion(hit).whale;
    const pushedBack = stormMotion(recoil).whale;
    expect(collision.x).toBeGreaterThan(from.x + .18);
    expect(collision.y).toBeLessThan(from.y - .13);
    expect(pushedBack.x).toBeLessThan(collision.x - .15);
    expect(pushedBack.y).toBeGreaterThan(collision.y + .12);
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

test('cá voi buồn và kiệt sức trước khi family đến rồi lấy lại hy vọng', () => {
  const tired = stormMotion(.545);
  expect(tired.phase).toBe('fatigue');
  expect(tired.family).toBe(0);
  expect(tired.whale.sadness).toBeGreaterThan(.9);
  expect(tired.whale.hope).toBe(0);
  expect(tired.whale.effort).toBeLessThan(.45);

  const supported = stormMotion(.755);
  expect(supported.phase).toBe('breakthrough');
  expect(supported.family).toBeGreaterThan(.99);
  expect(supported.whale.sadness).toBe(0);
  expect(supported.whale.hope).toBe(1);
  expect(supported.whale.effort).toBeGreaterThan(.95);
});

test('cá voi giữ đà liên tục trong pha Family cùng bứt phá', () => {
  [.71, .78, .86].forEach((progress) => {
    const before = stormMotion(progress - .004).whale;
    const after = stormMotion(progress + .004).whale;
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(.003);
  });
});

test('vật cản trôi ngược chiều, chặn đường rồi bị cả đàn đánh bật khỏi khung', () => {
  expect(STORM_OBSTACLES).toHaveLength(6);
  expect(STORM_OBSTACLES.map(obstacle => obstacle.label)).toEqual([
    'TOXIC', 'ÁP LỰC', 'BẾU', 'MỆT MỎI', 'SO SÁNH', 'TỰ NGHI NGỜ',
  ]);
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

test('mười tám cá voi con hội tụ quanh cá voi lớn rồi cùng tiến tới vùng sáng', () => {
  expect(STORM_COMPANION_COUNT).toBe(18);
  expect(STORM_MOBILE_COMPANION_COUNT).toBe(12);
  expect(stormMotion(.575).companions.every(companion => companion.opacity === 0)).toBe(true);

  const entering = stormMotion(.64);
  const visibleEntrants = entering.companions.filter(companion => companion.opacity > .08);
  expect(visibleEntrants.length).toBeGreaterThan(0);
  expect(visibleEntrants.length).toBeLessThan(STORM_COMPANION_COUNT);
  expect(visibleEntrants.every(companion => companion.x < 0)).toBe(true);

  const assembled = stormMotion(.735);
  expect(assembled.phase).toBe('breakthrough');
  expect(assembled.companions).toHaveLength(STORM_COMPANION_COUNT);
  expect(assembled.companions.every(companion => companion.arrival > .92)).toBe(true);
  expect(assembled.companions.some(companion => companion.x < assembled.whale.x)).toBe(true);
  expect(assembled.companions.some(companion => companion.x > assembled.whale.x)).toBe(true);
  expect(assembled.companions.some(companion => companion.y < assembled.whale.y)).toBe(true);
  expect(assembled.companions.some(companion => companion.y > assembled.whale.y)).toBe(true);

  const destination = stormMotion(.95);
  expect(destination.whale.x).toBeGreaterThan(assembled.whale.x + .3);
  expect(destination.whale.y).toBeLessThan(assembled.whale.y - .3);
  expect(destination.breakthrough).toBe(1);
});

test('mưa, sóng và sấm chớp có nhiều lớp độc lập rồi dịu dần', () => {
  const nearStrike = stormMotion(.155).storm;
  const farStrike = stormMotion(.255).storm;
  const sheetStrike = stormMotion(.345).storm;
  const clearing = stormMotion(.94).storm;

  expect(nearStrike.lightningNear).toBeGreaterThan(.95);
  expect(farStrike.lightningFar).toBeGreaterThan(.95);
  expect(sheetStrike.lightningSheet).toBeGreaterThan(.95);
  expect(nearStrike.rainNear).toBeGreaterThan(nearStrike.rainMid);
  expect(nearStrike.rainMid).toBeGreaterThan(nearStrike.rainFar);
  expect(nearStrike.swell).toBeGreaterThan(.7);
  expect(nearStrike.spray).toBeGreaterThan(.55);
  expect(clearing.rainNear).toBeLessThan(nearStrike.rainNear * .15);
  expect(clearing.intensity).toBeLessThan(nearStrike.intensity);
});

test('ánh sáng chỉ phủ màn hình sau khi cả đàn tới đích', () => {
  const beforeContact = stormMotion(.944);
  const contact = stormMotion(.95);
  expect(beforeContact.light.wipe).toBe(0);
  expect(beforeContact.phase).toBe('breakthrough');
  expect(contact.phase).toBe('light-wipe');
  expect(contact.breakthrough).toBe(1);
  expect(contact.light.wipe).toBeGreaterThan(.35);
  expect(contact.light.radius).toBeGreaterThan(65);
  expect(stormMotion(.955).light.wipe).toBeGreaterThan(contact.light.wipe);
  const end = stormMotion(1);
  expect(end.light.wipe).toBe(1);
  expect(end.light.radius).toBe(175);
  expect(end.storm.clear).toBe(1);
  expect(end.whale.opacity).toBeLessThan(.2);
});

test('mobile giữ hành trình trong vùng an toàn và cùng nhịp kể chuyện', () => {
  const start = stormMotion(0, { mobile: true });
  const family = stormMotion(.76, { mobile: true });
  const destination = stormMotion(.95, { mobile: true });
  expect(start.whale).toMatchObject({ x: .23, y: .79, scale: .46 });
  expect(family.phase).toBe('breakthrough');
  expect(family.companions.every(companion => companion.arrival > .92)).toBe(true);
  expect(destination.whale.x).toBeCloseTo(.735);
  expect(destination.whale.y).toBeCloseTo(.165);
  expect(destination.light).toMatchObject({ x: 76, y: 10 });
});
