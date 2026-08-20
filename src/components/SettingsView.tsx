"use client";

import { HeaderButton, NavHeader } from "@/components/NavHeader";
import { api } from "@/lib/client";
import type { Tag, Tracker } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function SettingsView() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [inElectron, setInElectron] = useState(false);

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
    setInElectron(Boolean(window.leaps));
  }, []);

  return (
    <div className="bg-grouped pb-10">
      <NavHeader
        title="Settings"
        left={
          <HeaderButton href="/" label="Back">
            <ChevronLeft size={26} />
          </HeaderButton>
        }
      />

      <p className="px-4 py-3 text-[13px] text-muted">
        Trackers, logs, tags, and milestones are stored in a SQLite file on this machine
        {inElectron ? " (Help → Show Data Folder)." : ". The browser is only the UI."}
      </p>

      <h2 className="px-4 pb-1 pt-4 text-[13px] font-semibold uppercase tracking-wide text-muted">Tags</h2>
      <div className="border-y border-black/[0.06] bg-white">
        <form
          className="flex gap-2 px-4 py-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await api("/api/tags", { method: "POST", body: JSON.stringify({ name }) });
            setName("");
            await load();
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} className="field-ios flex-1 text-left" placeholder="Health, Money, Morning…" />
          <button type="submit" className="text-[16px] font-semibold text-ios">
            Add
          </button>
        </form>
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="rounded-full bg-grouped px-3 py-1 text-xs font-semibold"
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
      </div>

      <h2 className="px-4 pb-1 pt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">Reorder trackers</h2>
      <ul className="divide-y divide-black/[0.06] border-y border-black/[0.06] bg-white">
        {trackers.filter((t) => !t.archived).map((tracker, index, list) => (
          <li key={tracker.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-[16px]">
              {tracker.emoji} {tracker.title}
            </span>
            <span className="flex gap-3 text-[15px] font-semibold text-ios">
              <button
                type="button"
                disabled={index === 0}
                className="disabled:opacity-30"
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
                className="disabled:opacity-30"
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

      <h2 className="px-4 pb-1 pt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">Data</h2>
      <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] bg-white">
        <button
          type="button"
          className="w-full px-4 py-3 text-left text-[16px] text-navy"
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
          className="w-full px-4 py-3 text-left text-[16px] text-navy"
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
      </div>
      {message && <p className="px-4 py-3 text-sm text-muted">{message}</p>}
      <p className="px-4 pt-6 text-center text-[12px] text-muted">Leaps — a web clone of Strides. Keep making strides.</p>
    </div>
  );
}
