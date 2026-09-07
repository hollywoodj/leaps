export const TRACKER_COLORS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#30B0C7",
  "#32ADE6",
  "#0A84FF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#A2845E",
];

export const EMOJI_SET = [
  "🎯", "🔥", "💪", "🧘", "📚", "💧", "🏃", "🚴", "🛌", "🧠",
  "🍎", "🥗", "💊", "🪥", "🚿", "☀️", "🌙", "✍️", "🎧", "💻", "📝",
  "💰", "🏦", "📉", "📈", "🏠", "🧹", "🍳", "🌱", "❤️", "📞",
  "👨‍👩‍👧", "🙏", "🚫", "☕", "🚬", "🍔", "📱", "🎮", "🍷", "🛒",
  "🎓", "🗣️", "🎸", "🎨", "✈️", "🐶", "🌳", "🧊", "⏱️", "⭐",
];

export function colorForIndex(index: number): string {
  return TRACKER_COLORS[index % TRACKER_COLORS.length];
}
