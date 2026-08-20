import { formatAmount, formatNumber } from "@/lib/stats";
import { formatPretty } from "@/lib/dates";
import type { ProgressSnapshot, Tracker } from "@/lib/types";

export function periodNoun(kind: Tracker["repeatKind"]): string {
  if (kind === "daily") return "Day";
  if (kind === "weekly") return "Week";
  return "Month";
}

export function periodShort(kind: Tracker["repeatKind"]): string {
  if (kind === "daily") return "today";
  if (kind === "weekly") return "this week";
  return "this month";
}

export function avgPeriodLabel(kind: Tracker["repeatKind"]): string {
  if (kind === "daily") return "avg / day";
  if (kind === "weekly") return "avg / week";
  return "avg / month";
}

export function frequencyLabel(tracker: Tracker): string {
  const unit = periodNoun(tracker.repeatKind);
  if (tracker.type === "habit") {
    if (tracker.isBad) {
      const n = tracker.goalValue;
      if (n === 0) return `0 per ${unit}`;
      return `${n} or fewer per ${unit}`;
    }
    const n = tracker.timesPerPeriod;
    if (n === 1) return `Once a ${unit}`;
    return `${n} Times per ${unit}`;
  }
  if (tracker.type === "average") {
    const n = formatAmount(tracker.goalValue, tracker.unit);
    return `${n} or More per ${unit}`;
  }
  if (tracker.type === "target") {
    const amount = formatAmount(tracker.goalValue, tracker.unit);
    if (!tracker.endDate) return amount;
    return `${amount} by ${formatPretty(tracker.endDate, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  if (tracker.endDate) {
    return `Complete by ${formatPretty(tracker.endDate, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return "Project";
}

export function reportMetrics(tracker: Tracker, progress: ProgressSnapshot): { primary: string; secondary: string } {
  if (tracker.type === "habit") {
    return {
      primary: `${formatNumber(progress.current)}/${formatNumber(progress.goal)}`,
      secondary: periodShort(tracker.repeatKind),
    };
  }
  if (tracker.type === "average") {
    return {
      primary: formatNumber(progress.current),
      secondary: avgPeriodLabel(tracker.repeatKind),
    };
  }
  if (tracker.type === "target") {
    const remaining = Math.max(0, progress.goal - progress.current);
    return {
      primary: formatNumber(progress.current),
      secondary: tracker.endDate
        ? `${formatAmount(progress.goal, tracker.unit)} by ${formatPretty(tracker.endDate, { month: "short", day: "numeric" })}`
        : `${formatNumber(remaining)} to go`,
    };
  }
  return {
    primary: `${Math.round(Math.min(progress.percent, 999))}%`,
    secondary: `${formatNumber(progress.current)} of ${formatNumber(progress.goal)}`,
  };
}

export function typeCopy(type: Tracker["type"]): { title: string; subtitle: string; examples: string } {
  if (type === "habit") {
    return { title: "Habit: Repeating Action", subtitle: "Examples: Drink Water or Journal", examples: "Example: Drink 8 glasses per day" };
  }
  if (type === "target") {
    return { title: "Target: Number by Date", subtitle: "Examples: Savings or Weight", examples: "Example: Save $5,000 by Dec 31" };
  }
  if (type === "average") {
    return { title: "Average: Repeating Number", subtitle: "Examples: Budget or Sleep", examples: "Example: Sleep 7.5 hours per day" };
  }
  return { title: "Project: Actions by Date", subtitle: "Examples: Marathon or Work", examples: "Example: Launch by June 30" };
}
