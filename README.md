# Leaps

A desktop and web clone of [Strides](https://www.stridesapp.com/) — habits, numeric targets, averages, and projects in one daily list.

**Pocket Pet** is a separate desktop app. Completing Leaps habits is how you care for it: check everything off and it stays healthy, skip the day and it dies. Fitness habits make it muscular or fat. Learning habits give it a graduation cap or a dumb look. Unfinished Hygiene habits add a smell. The original care buttons are gone.

**Data is not stored in the browser.** Trackers, logs, tags, and milestones live in a local SQLite file that both apps share. In the Leaps Electron app that file is in the app data folder (Help → Show Data Folder). Pocket Pet reads that same file. In the web server it is `data/leaps.db`.

## Features

- **Four tracker types** — Habit (good or bad), Target (pace line), Average, Project (milestones)
- **Reports** — progress, trends, calendar heatmap, streak rankings, tag filters
- **Templates** — health, fitness, money, learning, and more
- **Local SQLite** — export and import JSON from Settings
- **Pocket Pet (separate app)** — habit checkmarks drive a virtual pet. Tags map onto visuals (Hygiene, Fitness, Learning, Food, Sleep, Mind, Health).

## Run it

```bash
npm install
npm test
npm run electron:dev
```

Pocket Pet in a second window (leave Leaps’ Next server running):

```bash
npm run electron:pet:dev
```

Or start both at once:

```bash
npm run electron:both:dev
```

Or run the web UI only:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) for Leaps. Pocket Pet is [http://localhost:3001/pet](http://localhost:3001/pet). The web server binds to localhost only. On first launch the Today screen is empty; create a tracker or tap **Load sample data**.

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

Pocket Pet installers (same platforms; output goes to `release-pet/`):

```bash
npm run electron:pet:build:mac
npm run electron:pet:build:win
npm run electron:pet:build:linux
```

Pushing to `main` tags a GitHub Release and uploads the Leaps installers (same auto-release flow as the other desktop apps). The first release is `v1.0.0`; later pushes bump the patch. Skip a commit with `[skip release]`, or run the **Release** workflow by hand with a `vMAJOR.MINOR.PATCH` tag.

Optional: `LEAPS_DB_PATH=/absolute/path/to/leaps.db` to put the database somewhere else when running the web server. Packaged Pocket Pet looks for Leaps’ app-data copy of that file.
