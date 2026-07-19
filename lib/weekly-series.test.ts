import { describe, expect, it } from "vitest";
import { toWeeklySeries } from "./weekly-series";

// Sunday, so the current week is 6 days old (a partial week)
const NOW = new Date("2026-07-19T12:00:00Z");

describe("toWeeklySeries", () => {
  it("returns all-zero buckets for empty input", () => {
    const series = toWeeklySeries([], 14, NOW);
    expect(series).toEqual([
      { day: "2026-07-06", revenue: 0, orders: 0 },
      { day: "2026-07-13", revenue: 0, orders: 0 },
    ]);
  });

  it("buckets Monday through Sunday into the same week", () => {
    const series = toWeeklySeries(
      [
        { day: "2026-07-13", revenue: 100, orders: 1 },
        { day: "2026-07-19", revenue: 50.5, orders: 2 },
      ],
      14,
      NOW,
    );
    expect(series[1]).toEqual({ day: "2026-07-13", revenue: 150.5, orders: 3 });
  });

  it("splits Sunday and the following Monday into different weeks", () => {
    const series = toWeeklySeries(
      [
        { day: "2026-07-12", revenue: 10, orders: 1 },
        { day: "2026-07-13", revenue: 20, orders: 1 },
      ],
      14,
      NOW,
    );
    expect(series[0]).toEqual({ day: "2026-07-06", revenue: 10, orders: 1 });
    expect(series[1]).toEqual({ day: "2026-07-13", revenue: 20, orders: 1 });
  });

  it("keeps a trailing partial week as its own bucket", () => {
    const series = toWeeklySeries([{ day: "2026-07-19", revenue: 75, orders: 1 }], 10, NOW);
    expect(series).toEqual([
      { day: "2026-07-06", revenue: 0, orders: 0 },
      { day: "2026-07-13", revenue: 75, orders: 1 },
    ]);
  });

  it("ignores points outside the reporting window", () => {
    const series = toWeeklySeries(
      [
        { day: "2026-07-05", revenue: 999, orders: 9 },
        { day: "2026-07-14", revenue: 30, orders: 1 },
      ],
      14,
      NOW,
    );
    expect(series).toEqual([
      { day: "2026-07-06", revenue: 0, orders: 0 },
      { day: "2026-07-13", revenue: 30, orders: 1 },
    ]);
  });

  it("covers 180 days with 26 week buckets starting on Mondays", () => {
    const series = toWeeklySeries([], 180, NOW);
    expect(series).toHaveLength(26);
    for (const point of series) {
      expect(new Date(`${point.day}T00:00:00Z`).getUTCDay()).toBe(1);
    }
  });

  it("rounds accumulated revenue to cents", () => {
    const series = toWeeklySeries(
      [
        { day: "2026-07-13", revenue: 0.1, orders: 1 },
        { day: "2026-07-14", revenue: 0.2, orders: 1 },
      ],
      14,
      NOW,
    );
    expect(series[1].revenue).toBe(0.3);
  });
});
