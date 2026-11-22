// The building's alarm meter: four tiers, and a floor that never drops once a tier is reached.

export const ALARM_TIERS = [
  { name: 'Calm', from: 0, cone: 1.0, speed: 1.0, color: '#7fd1b9' },
  { name: 'Wary', from: 34, cone: 1.14, speed: 1.12, color: '#ffc861' },
  { name: 'Alert', from: 67, cone: 1.3, speed: 1.25, color: '#ff7a45' },
  { name: 'Lockdown', from: 100, cone: 1.4, speed: 1.3, color: '#ff3d5a' },
];

export function createAlarm() {
  return { value: 0, floor: 0, peak: 0, flash: 0, lastReason: '' };
}

export function alarmTier(alarm) {
  let tier = ALARM_TIERS[0];
  for (const t of ALARM_TIERS) if (alarm.value >= t.from) tier = t;
  return tier;
}

export function raiseAlarm(alarm, amount, reason) {
  const before = alarmTier(alarm);
  alarm.value = Math.min(100, alarm.value + amount);
  alarm.peak = Math.max(alarm.peak, alarm.value);
  alarm.flash = 1;
  alarm.lastReason = reason;
  const after = alarmTier(alarm);
  if (after !== before) alarm.floor = Math.min(after.from, 99);
  return after !== before ? after : null;
}

export function coolAlarm(alarm, dt, quiet) {
  alarm.flash = Math.max(0, alarm.flash - dt * 2);
  if (quiet && alarm.value < 100) alarm.value = Math.max(alarm.floor, alarm.value - dt * 1.6);
}

export function isLockdown(alarm) {
  return alarm.value >= 100;
}
