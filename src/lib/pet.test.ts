import { describe, expect, it } from "vitest";
import {
  collectTodayItems,
  derivePetState,
  matchPetCategory,
  petCategoryForItem,
  spriteForPet,
} from "./pet";
import type { TodayItem, Tracker } from "./types";

function tracker(title: string, id = title): Tracker {
  return {
    id,
    title,
    emoji: "🎯",
    type: "habit",
    color: "#0A84FF",
    unit: "",
    goalValue: 1,
    isBad: false,
    startDate: "2026-09-01",
    endDate: null,
    repeatKind: "daily",
    repeatInterval: 1,
    weekdays: null,
    timesPerPeriod: 1,
    sortOrder: 0,
    archived: false,
    notes: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

function item(title: string, section: TodayItem["section"], tags: { name: string }[] = []): TodayItem {
  return {
    tracker: tracker(title),
    tags: tags.map((tag, index) => ({ id: `${title}-tag-${index}`, name: tag.name, color: "#000" })),
    section,
    progress: {
      label: "",
      percent: section === "done" ? 100 : 0,
      pacePercent: null,
      onTrack: section === "done",
      streak: 0,
      bestStreak: 0,
      successRate: 0,
      current: section === "done" ? 1 : 0,
      goal: 1,
      unit: "",
    },
    todayLogs: [],
    todayValue: section === "done" ? 1 : 0,
    milestones: [],
  };
}

describe("matchPetCategory", () => {
  it("maps tag names and titles onto visual buckets", () => {
    expect(matchPetCategory("Hygiene")).toBe("hygiene");
    expect(matchPetCategory("hygeine")).toBe("hygiene");
    expect(matchPetCategory("Fitness")).toBe("fitness");
    expect(matchPetCategory("Morning Workout")).toBe("fitness");
    expect(matchPetCategory("Floss")).toBe("hygiene");
    expect(matchPetCategory("Drink Water")).toBe("food");
    expect(matchPetCategory("brunch")).toBeNull();
  });
});

describe("petCategoryForItem", () => {
  it("prefers the Leaps tag, then the tracker title", () => {
    expect(petCategoryForItem(item("Random", "due", [{ name: "Hygiene" }]))).toBe("hygiene");
    expect(petCategoryForItem(item("Exercise", "due"))).toBe("fitness");
    expect(petCategoryForItem(item("Inbox Zero", "due"))).toBeNull();
  });
});

describe("derivePetState", () => {
  it("is an egg with no habits", () => {
    const pet = derivePetState([]);
    expect(pet.stage).toBe("egg");
    expect(pet.alive).toBe(false);
    expect(pet.smell).toBe(false);
    expect(pet.sizeScale).toBe(1);
    expect(spriteForPet(pet)).toBe("egg");
  });

  it("is healthy only when every habit is complete", () => {
    const dead = derivePetState([item("Journal", "due"), item("Read", "done")]);
    expect(dead.alive).toBe(false);
    expect(dead.stage).toBe("dead");
    expect(dead.status).toBe("DEAD");
    expect(spriteForPet(dead)).toBe("dead");

    const happy = derivePetState([item("Journal", "done"), item("Read", "done")]);
    expect(happy.alive).toBe(true);
    expect(happy.stage).toBe("happy");
    expect(happy.status).toBe("HAPPY");
    expect(spriteForPet(happy)).toBe("baby");
  });

  it("treats skipped habits as complete and missed as incomplete", () => {
    const pet = derivePetState([item("Meditate", "done"), item("Sugar", "missed")]);
    expect(pet.alive).toBe(false);
    expect(pet.done).toBe(1);
    expect(pet.total).toBe(2);
  });

  it("folds every hygiene habit into one smell visual", () => {
    const items = [
      item("Floss", "done", [{ name: "Hygiene" }]),
      item("Shower", "due", [{ name: "Hygiene" }]),
      item("Exercise", "done", [{ name: "Fitness" }]),
    ];
    const pet = derivePetState(items);
    const hygiene = pet.categories.find((cat) => cat.id === "hygiene")!;
    expect(hygiene.present).toBe(true);
    expect(hygiene.total).toBe(2);
    expect(hygiene.done).toBe(1);
    expect(hygiene.complete).toBe(false);
    expect(pet.smell).toBe(true);
    expect(pet.status).toBe("DEAD · STINKY");
  });

  it("clears the smell when the whole hygiene category is done", () => {
    const pet = derivePetState([
      item("Floss", "done", [{ name: "Hygiene" }]),
      item("Shower", "done", [{ name: "Hygiene" }]),
    ]);
    expect(pet.smell).toBe(false);
    expect(pet.alive).toBe(true);
  });

  it("grows the pet from the fitness category, including when other habits are unfinished", () => {
    const small = derivePetState([item("Gym", "due", [{ name: "Fitness" }]), item("Floss", "due", [{ name: "Hygiene" }])]);
    expect(small.bigger).toBe(false);
    expect(small.sizeScale).toBe(0.82);
    expect(small.smell).toBe(true);

    const big = derivePetState([item("Gym", "done", [{ name: "Fitness" }]), item("Floss", "due", [{ name: "Hygiene" }])]);
    expect(big.alive).toBe(false);
    expect(big.bigger).toBe(true);
    expect(big.sizeScale).toBe(1.32);
    expect(big.smell).toBe(true);
    expect(spriteForPet(big)).toBe("dead");

    const jacked = derivePetState([item("Gym", "done", [{ name: "Fitness" }]), item("Floss", "done", [{ name: "Hygiene" }])]);
    expect(jacked.alive).toBe(true);
    expect(jacked.bigger).toBe(true);
    expect(spriteForPet(jacked)).toBe("adult");
  });

  it("maps leftover visual categories without letting them override hygiene or fitness", () => {
    const pet = derivePetState([
      item("Drink Water", "due"),
      item("Sleep 8h", "due"),
      item("Meditate", "done", [{ name: "Mind" }]),
      item("Vitamins", "due", [{ name: "Health" }]),
    ]);
    expect(pet.hungry).toBe(true);
    expect(pet.tired).toBe(true);
    expect(pet.sad).toBe(false);
    expect(pet.sick).toBe(true);
    expect(pet.smell).toBe(false);
    expect(pet.bigger).toBe(false);
  });
});

describe("collectTodayItems", () => {
  it("keeps due, missed, and done in one list", () => {
    const items = collectTodayItems({
      due: [item("A", "due")],
      missed: [item("B", "missed")],
      done: [item("C", "done")],
    });
    expect(items.map((row) => row.tracker.title)).toEqual(["A", "B", "C"]);
  });
});
