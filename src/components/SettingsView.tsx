"use client";

import { api } from "@/lib/client";
import type { Tag, Tracker } from "@/lib/types";
import { useEffect, useState } from "react";

export function SettingsView() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [tagPayload, trackerPayload] = await Promise.all([
      api<{ tags: Tag[] }>("/api/tags"),
      api<{ trackers: Tracker[] }>("/api/trackers?archived=1"),
    ]);
    setTags(tagPayload.tags);
    setTrackers(trackerPayload.trackers);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Local data</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Trackers, logs, tags, and milestones are stored in a SQLite file on this machine at <code className="rounded bg-stone-200 px-1">data/leaps.db</code>.
        The browser is only the UI.
      </p>

      <section className="card mt-6 p-4">
        <h2 className="font-semibold">Tags</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await api("/api/tags", { method: "POST", body: JSON.stringify({ name }) });
            setName("");
            await load();
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Health, Money, Morning…" />
          <button type="submit" className="rounded-xl bg-teal px-4 text-sm font-semibold text-white">
            Add
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold"
              onClick={async () => {
                await api(`/api/tags?id=${tag.id}`, { method: "DELETE" });
                await load();
              }}
              title="Delete tag"
            >
              {tag.name} ×
            </button>
          ))}
        </div>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="font-semibold">Reorder trackers</h2>
        <p className="mt-1 text-sm text-muted">Active trackers appear in this order on Today.</p>
        <ul className="mt-3 space-y-2">
          {trackers.filter((t) => !t.archived).map((tracker, index, list) => (
            <li key={tracker.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2">
              <span>
                {tracker.emoji} {tracker.title}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-semibold disabled:opacity-30"
                  onClick={async () => {
                    const ids = list.map((t) => t.id);
                    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                    await api("/api/trackers/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
                    await load();
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={index === list.length - 1}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-semibold disabled:opacity-30"
                  onClick={async () => {
                    const ids = list.map((t) => t.id);
                    [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                    await api("/api/trackers/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
                    await load();
                  }}
                >
                  Down
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <h2 className="font-semibold">Sample data & export</h2>
        <button
          type="button"
          className="w-full rounded-xl bg-stone-100 py-3 text-sm font-semibold"
          onClick={async () => {
            await api("/api/data", { method: "POST" });
            setMessage("Sample trackers added if the database was empty.");
            await load();
          }}
        >
          Load sample data
        </button>
        <button
          type="button"
          className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white"
          onClick={async () => {
            const payload = await api<unknown>("/api/data");
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "leaps-export.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </button>
        {message && <p className="text-sm text-muted">{message}</p>}
      </section>
    </div>
  );
}
