# Leaps

A web clone of [Strides](https://www.stridesapp.com/) — habits, numeric targets, averages, and projects in one daily list.

The UI is a browser app. **Data is not stored in the browser.** Trackers, logs, tags, and milestones live in a local SQLite file on the machine that runs the server (`data/leaps.db`).

## Features

- **Daily Goals** — due / missed / done, date backlog, skip, perfect-day banner
- **Four tracker types** — Habit (good or bad), Target (pace line), Average, Project (milestones)
- **Reports** — progress, trends, calendar heatmap, streak rankings, tag filters
- **Templates** — health, fitness, money, learning, and more
- **Local SQLite** — export JSON from Settings

## Run it

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first launch the Today screen is empty; create a tracker or tap **Load sample data**.

```bash
npm run build
npm start
```

Optional: `LEAPS_DB_PATH=/absolute/path/to/leaps.db` to put the database somewhere else.
