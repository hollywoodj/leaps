import type { TodayItem } from "./types";

/** Visual buckets on the pet. Leaps tags (and titles) fold into these. */
export type PetVisualCategory = "hygiene" | "fitness" | "food" | "sleep" | "mind" | "health";

export const PET_VISUAL_CATEGORIES: {
  id: PetVisualCategory;
  label: string;
  color: string;
  aliases: string[];
  effect: string;
}[] = [
  {
    id: "hygiene",
    label: "Hygiene",
    color: "#30B0C7",
    aliases: ["hygiene", "hygeine", "clean", "cleaning", "shower", "bath", "floss", "brush", "dental", "grooming", "wash", "teeth", "skincare", "tidy"],
    effect: "Incomplete shows a smell.",
  },
  {
    id: "fitness",
    label: "Fitness",
    color: "#FF3B30",
    aliases: ["fitness", "workout", "exercise", "gym", "training", "sport", "cardio", "strength", "run", "running", "lift", "yoga"],
    effect: "Complete makes the pet bigger.",
  },
  {
    id: "food",
    label: "Food",
    color: "#FF9500",
    aliases: ["food", "diet", "nutrition", "meal", "eat", "eating", "hunger", "water", "drink", "cook"],
    effect: "Incomplete looks hungry.",
  },
  {
    id: "sleep",
    label: "Sleep",
    color: "#5856D6",
    aliases: ["sleep", "rest", "energy", "bedtime", "nap"],
    effect: "Incomplete looks tired.",
  },
  {
    id: "mind",
    label: "Mind",
    color: "#AF52DE",
    aliases: ["mind", "mental", "mood", "happiness", "journal", "meditat", "gratitude", "social", "relationship"],
    effect: "Incomplete looks sad.",
  },
  {
    id: "health",
    label: "Health",
    color: "#34C759",
    aliases: ["health", "medicine", "vitamin", "wellness", "meds"],
    effect: "Incomplete looks sick.",
  },
];

export type PetCategoryStatus = {
  id: PetVisualCategory;
  label: string;
  present: boolean;
  complete: boolean;
  done: number;
  total: number;
};

export type PetStage = "egg" | "happy" | "dead";

export type PetState = {
  stage: PetStage;
  alive: boolean;
  smell: boolean;
  hungry: boolean;
  tired: boolean;
  sad: boolean;
  sick: boolean;
  bigger: boolean;
  sizeScale: number;
  status: string;
  done: number;
  total: number;
  categories: PetCategoryStatus[];
};

const ALIAS_INDEX: { id: PetVisualCategory; alias: string }[] = PET_VISUAL_CATEGORIES.flatMap((cat) =>
  cat.aliases.map((alias) => ({ id: cat.id, alias })),
).sort((a, b) => b.alias.length - a.alias.length);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function matchPetCategory(text: string): PetVisualCategory | null {
  const parts = tokens(text);
  if (!parts.length) return null;
  const joined = parts.join(" ");
  for (const { id, alias } of ALIAS_INDEX) {
    const aliasParts = alias.split(/\s+/);
    if (aliasParts.length > 1) {
      if (joined.includes(alias)) return id;
      continue;
    }
    if (parts.some((part) => part === alias || part.startsWith(alias))) return id;
  }
  return null;
}

export function petCategoryForItem(item: Pick<TodayItem, "tracker" | "tags">): PetVisualCategory | null {
  for (const tag of item.tags) {
    const fromTag = matchPetCategory(tag.name);
    if (fromTag) return fromTag;
  }
  return matchPetCategory(item.tracker.title);
}

export function colorForPetCategoryName(name: string): string | undefined {
  const id = matchPetCategory(name);
  return PET_VISUAL_CATEGORIES.find((cat) => cat.id === id)?.color;
}

function emptyCategories(): PetCategoryStatus[] {
  return PET_VISUAL_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    present: false,
    complete: true,
    done: 0,
    total: 0,
  }));
}

function isComplete(item: TodayItem): boolean {
  return item.section === "done";
}

export function derivePetState(items: TodayItem[]): PetState {
  const categories = emptyCategories();
  const byId = new Map(categories.map((cat) => [cat.id, cat]));
  let done = 0;

  for (const item of items) {
    if (isComplete(item)) done += 1;
    const bucket = petCategoryForItem(item);
    if (!bucket) continue;
    const cat = byId.get(bucket);
    if (!cat) continue;
    cat.present = true;
    cat.total += 1;
    if (isComplete(item)) cat.done += 1;
  }

  for (const cat of categories) {
    cat.complete = !cat.present || cat.done === cat.total;
  }

  const total = items.length;
  const hygiene = byId.get("hygiene")!;
  const fitness = byId.get("fitness")!;
  const food = byId.get("food")!;
  const sleep = byId.get("sleep")!;
  const mind = byId.get("mind")!;
  const health = byId.get("health")!;

  const alive = total > 0 && done === total;
  const smell = hygiene.present && !hygiene.complete;
  const hungry = food.present && !food.complete;
  const tired = sleep.present && !sleep.complete;
  const sad = mind.present && !mind.complete;
  const sick = health.present && !health.complete;
  const fitnessRatio = fitness.present && fitness.total ? fitness.done / fitness.total : 0;
  const bigger = fitness.present && fitness.complete;
  const sizeScale = fitness.present ? 0.82 + 0.5 * fitnessRatio : 1;

  let stage: PetStage = "egg";
  let status = "ADD HABITS";
  if (total > 0 && alive) {
    stage = "happy";
    status = "HAPPY";
  } else if (total > 0) {
    stage = "dead";
    status = "DEAD";
    if (smell) status = "DEAD · STINKY";
  }

  return {
    stage,
    alive,
    smell,
    hungry,
    tired,
    sad,
    sick,
    bigger,
    sizeScale: Math.round(sizeScale * 100) / 100,
    status,
    done,
    total,
    categories,
  };
}

export function petTagColor(name: string, fallback?: string): string {
  return colorForPetCategoryName(name) ?? fallback ?? "#0A84FF";
}

export type PetSpriteName = "egg" | "baby" | "adult" | "sick" | "dead" | "sleep" | "sad";

/** Original Pocket Pet pixel frames (10×7). */
export const PET_SPRITES: Record<PetSpriteName, [string[], string[]]> = {
  egg: [
    ["    ##    ", "  ######  ", " ##    ## ", "##      ##", "##      ##", " ##    ## ", "  ######  "],
    ["    ##    ", "  ######  ", " ##    ## ", "##      ##", "##      ##", "  ##  ##  ", "   ####   "],
  ],
  baby: [
    [" ##    ## ", "  ######  ", " ######## ", "##  ##  ##", "####  ####", " ######## ", "  ##  ##  "],
    [" ##    ## ", "  ######  ", " ######## ", "##  ##  ##", "### ## ###", " ######## ", " ##    ## "],
  ],
  adult: [
    ["##      ##", " ######## ", "## #### ##", "####  ####", " ######## ", "##  ##  ##", " ##    ## "],
    ["##      ##", " ######## ", "## #### ##", "### ## ###", " ######## ", " ##    ## ", "##      ##"],
  ],
  sick: [
    [" ##    ## ", "  ######  ", " ######## ", "##  ##  ##", "### ## ###", " #  ##  # ", "  ######  "],
    [" ##    ## ", "  ######  ", " ######## ", "##  ##  ##", "### ## ###", "  ######  ", "   #  #   "],
  ],
  dead: [
    [" ##    ## ", "  ##  ##  ", "   ####   ", "  ##  ##  ", " ##    ## ", "          ", "  ######  "],
    [" ##    ## ", "  ##  ##  ", "   ####   ", "  ##  ##  ", " ##    ## ", "          ", "  ######  "],
  ],
  sleep: [
    ["      ##  ", "     ##   ", "    ####  ", " ##    ## ", "  ######  ", "   ## ##  ", "  ##   ## "],
    ["    ##    ", "   ##     ", "  ####    ", " ##    ## ", "  ######  ", "  ##  ##  ", " ##    ## "],
  ],
  sad: [
    [" ##    ## ", "  ######  ", " ######## ", "##  ##  ##", "####  ####", " ## ## ## ", "  ######  "],
    [" ##    ## ", "  ######  ", " ######## ", "##  ##  ##", "### ## ###", " ##    ## ", "  ######  "],
  ],
};

export const SMELL_FRAMES: [string[], string[]] = [
  ["  #   #   ", " #  #     ", "#    #  # ", "  #    #  ", "     #    "],
  [" #  #     ", "  #   #  #", " #  #     ", "#    #    ", "  #    #  "],
];

export function spriteForPet(state: PetState): PetSpriteName {
  if (state.stage === "egg") return "egg";
  if (!state.alive) return "dead";
  return state.bigger ? "adult" : "baby";
}

export function collectTodayItems(data: { due: TodayItem[]; done: TodayItem[]; missed: TodayItem[] }): TodayItem[] {
  return [...data.due, ...data.missed, ...data.done];
}
