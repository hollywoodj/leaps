"use client";

import { BackButton, NavHeader } from "@/components/NavHeader";
import { api } from "@/lib/client";
import type { Tag, Tracker } from "@/lib/types";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
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

  const live = trackers.filter((t) => !t.archived);

  return (
    <div className="min-h-full bg-grouped pb-10">
      <NavHeader title="Settings" left={<BackButton href="/" label="Daily Goals" />} />

      <p className="px-4 py-3 text-[13px] leading-5 text-muted">
        Trackers, logs, tags, and milestones are stored in a SQLite file on this machine
        {inElectron ? " (Help → Show Data Folder)." : ". The browser is only the UI."}
      </p>

      <h2 className="ios-section">Pocket Pet</h2>
      <div className="ios-inset px-4 py-3 text-[15px] leading-5 text-label">
        <p>
          Completing every due habit keeps the pet alive. Leaving any incomplete kills it. There are no feed, clean, or game
          buttons — checkmarks are the only input.
        </p>
        <p className="mt-2 text-[13px] text-muted">
          Tag habits so they share one visual: Hygiene (smell when unfinished), Fitness (bigger when done), Food, Sleep, Mind,
          and Health.
        </p>
      </div>

      <h2 className="ios-section">Tags</h2>
      <div className="ios-inset">
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
          <button type="submit" className="text-[17px] font-semibold text-ios press">
            Add
          </button>
        </form>
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="rounded-full px-3 py-1 text-[13px] font-semibold text-white press"
              style={{ background: tag.color }}
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

      <h2 className="ios-section">Reorder trackers</h2>
      {live.length ? (
        <ul className="ios-inset divide-y divide-[rgba(60,60,67,0.12)]">
          {live.map((tracker, index, list) => (
            <li key={tracker.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-[17px]">
                {tracker.emoji} {tracker.title}
              </span>
              <span className="flex gap-1 text-ios">
                <button
                  type="button"
                  disabled={index === 0}
                  className="flex h-9 w-9 items-center justify-center disabled:opacity-30 press"
                  aria-label="Move up"
                  onClick={async () => {
                    const ids = list.map((t) => t.id);
                    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                    await api("/api/trackers/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
                    await load();
                  }}
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  type="button"
                  disabled={index === list.length - 1}
                  className="flex h-9 w-9 items-center justify-center disabled:opacity-30 press"
                  aria-label="Move down"
                  onClick={async () => {
                    const ids = list.map((t) => t.id);
                    [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                    await api("/api/trackers/reorder", { method: "PATCH", body: JSON.stringify({ ids }) });
                    await load();
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ios-inset px-4 py-3 text-[15px] text-muted">No trackers yet.</p>
      )}

      <h2 className="ios-section">Data</h2>
      <div className="ios-inset divide-y divide-[rgba(60,60,67,0.12)]">
        <button
          type="button"
          className="w-full px-4 py-3 text-left text-[17px] text-ios press"
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
          className="w-full px-4 py-3 text-left text-[17px] text-ios press"
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
        <label className="block w-full cursor-pointer px-4 py-3 text-left text-[17px] text-ios press">
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text()) as unknown;
                const proceed = window.confirm("Import this backup into Leaps?");
                if (!proceed) return;
                const replace = window.confirm(
                  "Replace all current data with this file?\n\nOK = replace everything. Cancel = merge (same ids are overwritten).",
                );
                const result = await api<{ trackers: number; logs: number; tags: number }>("/api/data", {
                  method: "PUT",
                  body: JSON.stringify({ data: parsed, replace }),
                });
                setMessage(`Imported ${result.trackers} trackers, ${result.logs} logs, ${result.tags} tags.`);
                await load();
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Could not import file");
              }
            }}
          />
        </label>
      </div>
      {message && <p className="px-4 py-3 text-sm text-muted">{message}</p>}

      <h2 className="ios-section">More</h2>
      <div className="ios-inset divide-y divide-[rgba(60,60,67,0.12)]">
        <a
          href="https://github.com/hollywoodj/leaps/issues/new"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-4 py-3 text-[17px] text-label press"
        >
          Rate / Feedback
          <ChevronRight size={16} className="text-[#c7c7cc]" />
        </a>
        <a
          href="https://github.com/hollywoodj/leaps#readme"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-4 py-3 text-[17px] text-label press"
        >
          Help
          <ChevronRight size={16} className="text-[#c7c7cc]" />
        </a>
      </div>

      <p className="px-4 pt-8 text-center text-[13px] text-muted">Keep making strides.</p>
      <p className="px-4 pt-1 text-center text-[11px] text-muted">Leaps 1.0.0</p>
    </div>
  );
}
