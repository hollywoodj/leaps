import { describe, expect, it } from "vitest";
import {
  collectTodayItems,
  derivePetState,
  matchPetCategory,
  PET_SPRITES,
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
    expect(matchPetCategory("Read 20 Minutes")).toBe("learning");
    expect(matchPetCategory("Learning")).toBe("learning");
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
    expect(pet.fat).toBe(false);
    expect(pet.muscled).toBe(false);
    expect(spriteForPet(pet)).toBe("egg");
  });

  it("is healthy only when every habit is complete", () => {
    const dead = derivePetState([item("Journal", "due"), item("Read", "done")]);
    expect(dead.alive).toBe(false);
    expect(dead.stage).toBe("dead");
    expect(dead.status).toBe("DEAD");
    expect(spriteForPet(dead)).toBe("dead");

    const happy = derivePetState([item("Inbox Zero", "done"), item("Call Mom", "done")]);
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

  it("gives the pet muscles when fitness is done and fat when it is not", () => {
    const soft = derivePetState([item("Gym", "due", [{ name: "Fitness" }]), item("Floss", "due", [{ name: "Hygiene" }])]);
    expect(soft.fat).toBe(true);
    expect(soft.muscled).toBe(false);
    expect(soft.smell).toBe(true);
    expect(spriteForPet(soft)).toBe("fatDead");

    const jackedDead = derivePetState([item("Gym", "done", [{ name: "Fitness" }]), item("Floss", "due", [{ name: "Hygiene" }])]);
    expect(jackedDead.alive).toBe(false);
    expect(jackedDead.muscled).toBe(true);
    expect(jackedDead.fat).toBe(false);
    expect(spriteForPet(jackedDead)).toBe("muscledDead");

    const jacked = derivePetState([item("Gym", "done", [{ name: "Fitness" }]), item("Floss", "done", [{ name: "Hygiene" }])]);
    expect(jacked.alive).toBe(true);
    expect(jacked.muscled).toBe(true);
    expect(spriteForPet(jacked)).toBe("muscled");
  });

  it("puts a graduation cap on finished learning and a dumb look when it is skipped", () => {
    const slow = derivePetState([
      item("Read 20 Minutes", "due", [{ name: "Learning" }]),
      item("Study Spanish", "due", [{ name: "Learning" }]),
    ]);
    const learning = slow.categories.find((cat) => cat.id === "learning")!;
    expect(learning.present).toBe(true);
    expect(learning.total).toBe(2);
    expect(learning.complete).toBe(false);
    expect(slow.dumb).toBe(true);
    expect(slow.graduated).toBe(false);
    expect(slow.alive).toBe(false);
    expect(spriteForPet(slow)).toBe("deadDumb");

    const half = derivePetState([
      item("Read 20 Minutes", "done", [{ name: "Learning" }]),
      item("Study Spanish", "due", [{ name: "Learning" }]),
    ]);
    expect(half.dumb).toBe(true);
    expect(half.graduated).toBe(false);

    const grad = derivePetState([
      item("Read 20 Minutes", "done", [{ name: "Learning" }]),
      item("Study Spanish", "done", [{ name: "Learning" }]),
    ]);
    expect(grad.alive).toBe(true);
    expect(grad.graduated).toBe(true);
    expect(grad.dumb).toBe(false);
    expect(grad.status).toBe("GRAD");
  });

  it("can stack muscles, a cap, smell, and a dumb look from separate categories", () => {
    const pet = derivePetState([
      item("Gym", "done", [{ name: "Fitness" }]),
      item("Floss", "due", [{ name: "Hygiene" }]),
      item("Read", "due", [{ name: "Learning" }]),
    ]);
    expect(pet.muscled).toBe(true);
    expect(pet.fat).toBe(false);
    expect(pet.smell).toBe(true);
    expect(pet.dumb).toBe(true);
    expect(pet.graduated).toBe(false);
    expect(spriteForPet(pet)).toBe("muscledDead");
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
    expect(pet.muscled).toBe(false);
    expect(pet.fat).toBe(false);
    expect(pet.graduated).toBe(false);
    expect(pet.dumb).toBe(false);
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

describe("PET_SPRITES", () => {
  it("keeps every frame rectangular", () => {
    for (const [name, frames] of Object.entries(PET_SPRITES)) {
      for (const rows of frames) {
        const width = rows[0].length;
        expect(rows.every((row) => row.length === width), name).toBe(true);
      }
    }
  });
});
