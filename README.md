# Leaps

A desktop and web clone of [Strides](https://www.stridesapp.com/) — habits, numeric targets, averages, and projects in one daily list. Completing those habits is also how you care for **Pocket Pet**, a display-only 1990s virtual pet: check everything off and it stays healthy, skip the day and it dies. Fitness habits make it muscular or fat. Learning habits give it a graduation cap or a dumb look. Unfinished Hygiene habits add a smell. The original care buttons are gone.

**Data is not stored in the browser.** Trackers, logs, tags, and milestones live in a local SQLite file. In the Electron app that file is in the app data folder (Help → Show Data Folder). In the web server it is `data/leaps.db`.

## Features

- **Pocket Pet** — habit checkmarks drive a virtual pet. Tags map onto visuals (Hygiene, Fitness, Learning, Food, Sleep, Mind, Health).
- **Four tracker types** — Habit (good or bad), Target (pace line), Average, Project (milestones)
- **Reports** — progress, trends, calendar heatmap, streak rankings, tag filters
- **Templates** — health, fitness, money, learning, and more
- **Local SQLite** — export and import JSON from Settings

## Run it

```bash
npm install
npm test
npm run electron:dev
```

Or run the web UI only:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The web server binds to localhost only. On first launch the Today screen is empty; create a tracker or tap **Load sample data**.

```bash
npm run build
npm start
```

Packaged installers (macOS dmg, Windows nsis, Linux AppImage):

```bash
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

Pushing to `main` tags a GitHub Release and uploads those installers (same auto-release flow as the other desktop apps). The first release is `v1.0.0`; later pushes bump the patch. Skip a commit with `[skip release]`, or run the **Release** workflow by hand with a `vMAJOR.MINOR.PATCH` tag.

Optional: `LEAPS_DB_PATH=/absolute/path/to/leaps.db` to put the database somewhere else when running the web server.
