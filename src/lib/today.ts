import type { TodayItem } from "./types";

export function collectTodayItems(data: { due: TodayItem[]; done: TodayItem[]; missed: TodayItem[] }): TodayItem[] {
  return [...data.due, ...data.missed, ...data.done];
}
