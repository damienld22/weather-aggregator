import { describe, expect, it } from 'vitest';
import { mergeForecasts } from './aggregator';
import { describeSlot } from './slots';
import type { RainForecast } from './types';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 8, 30, 9);

function forecast(slots: Array<[number, number]>): RainForecast {
  return {
    location: 'La Bouëxière',
    fetchedAt: new Date(T0),
    entries: slots.map(([timestamp, amount]) => ({ ...describeSlot(timestamp), amount })),
  };
}

describe('mergeForecasts', () => {
  it('merges models on the same slot into one row', () => {
    const merged = mergeForecasts({
      gfs: forecast([[T0, 0]]),
      iconeu: forecast([[T0, 0.5]]),
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ timeRange: '08h-11h', gfs: 0, iconeu: 0.5 });
    expect(merged[0].arome).toBeUndefined();
  });

  it('sorts rows chronologically whatever the model order', () => {
    const merged = mergeForecasts({
      gfs: forecast([[T0, 0], [T0 + 3 * HOUR, 0]]),
      arome: forecast([[T0 - 3 * HOUR, 1.1]]),
    });

    expect(merged.map(e => e.timeRange)).toEqual(['05h-08h', '08h-11h', '11h-14h']);
  });

  it('ignores missing models', () => {
    expect(mergeForecasts({ wrf: null, arome: forecast([[T0, 2]]) })).toHaveLength(1);
  });
});
