import { describe, expect, it } from 'vitest';
import { aggregateHourlyTo3Hours, describeSlot, localToTimestamp } from './slots';

const HOUR = 3_600_000;

describe('localToTimestamp', () => {
  it('converts Paris summer time (UTC+2)', () => {
    const ref = new Date(Date.UTC(2026, 8, 30, 11));
    expect(localToTimestamp(30, 8, ref)).toBe(Date.UTC(2026, 8, 30, 6));
  });

  it('converts Paris winter time (UTC+1)', () => {
    const ref = new Date(Date.UTC(2026, 0, 15, 11));
    expect(localToTimestamp(15, 8, ref)).toBe(Date.UTC(2026, 0, 15, 7));
  });

  it('resolves a day-of-month belonging to the next month', () => {
    const ref = new Date(Date.UTC(2026, 8, 30, 11));
    expect(localToTimestamp(1, 2, ref)).toBe(Date.UTC(2026, 9, 1, 0));
  });

  it('resolves a day-of-month belonging to the previous month', () => {
    const ref = new Date(Date.UTC(2026, 9, 1, 11));
    expect(localToTimestamp(30, 23, ref)).toBe(Date.UTC(2026, 8, 30, 21));
  });

  it('resolves across a year boundary', () => {
    const ref = new Date(Date.UTC(2026, 11, 31, 11));
    expect(localToTimestamp(1, 1, ref)).toBe(Date.UTC(2027, 0, 1, 0));
  });
});

describe('describeSlot', () => {
  it('labels a summer slot in Paris local time', () => {
    expect(describeSlot(Date.UTC(2026, 8, 30, 9))).toEqual({
      timestamp: Date.UTC(2026, 8, 30, 9),
      day: 'Mercredi 30',
      hour: '11h',
      timeRange: '08h-11h',
    });
  });

  it('labels a slot crossing midnight with the day it ends on', () => {
    expect(describeSlot(Date.UTC(2026, 8, 30, 23))).toMatchObject({
      day: 'Jeudi 1',
      hour: '01h',
      timeRange: '22h-01h',
    });
  });

  it('uses the real local start hour on the DST switch day', () => {
    expect(describeSlot(Date.UTC(2026, 9, 25, 3))).toMatchObject({
      day: 'Dimanche 25',
      hour: '04h',
      timeRange: '02h-04h',
    });
  });
});

describe('aggregateHourlyTo3Hours', () => {
  it('groups hourly amounts on the UTC 3-hour grid shared by all models', () => {
    const base = Date.UTC(2026, 8, 30, 7);
    const hourly = [0.1, 0.2, 0.3, 1, 0, 0].map((amount, i) => ({
      timestamp: base + i * HOUR,
      amount,
    }));

    const slots = aggregateHourlyTo3Hours(hourly);

    expect(slots.map(s => [s.timeRange, s.amount.toFixed(1)])).toEqual([
      ['08h-11h', '0.6'],
      ['11h-14h', '1.0'],
    ]);
  });

  it('aligns on the winter grid without any hard-coded hours', () => {
    const base = Date.UTC(2026, 0, 15, 7);
    const hourly = [0, 0, 0.5].map((amount, i) => ({
      timestamp: base + i * HOUR,
      amount,
    }));

    expect(aggregateHourlyTo3Hours(hourly).map(s => s.timeRange)).toEqual([
      '07h-10h',
    ]);
  });
});
