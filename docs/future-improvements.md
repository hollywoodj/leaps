# Future improvements

Leaps is a desktop/web clone of [Strides](https://www.stridesapp.com/). The UI chrome on Daily Goals, Reports, Add Tracker, Settings, and tracker detail is already a close visual match. This list is the remaining gap: things Strides does that Leaps does not, plus polish that still reads as “web app” rather than iOS.

Nothing here is claimed as done. Items are grouped so the next pass can pick a coherent slice instead of another mixed bag of one-offs.

## Interaction chrome

- **Pull-to-refresh** on Daily Goals and Reports, with the iOS rubber-band spinner.
- **Long-press the check circle** to Skip (Strides) instead of only swipe.
- **Haptics / check sound** when a habit completes (Electron: optional click; iOS: Taptic).
- **Confetti / celebration** on Perfect Day that matches Strides’ overlay more closely (particles, not only a modal).
- **Undo toast** after log, skip, or delete (“Undo” for a few seconds).
- **Edge swipe back** from tracker detail, create, and settings.
- **Context menu** (right-click / long-press) on a row: Yes, Skip, Log, Edit, Archive.
- **Drag-to-reorder** on Daily Goals itself. Settings already has up/down buttons; Strides reorders in the list.
- **Keyboard**: j/k or arrows through rows, space to check, `e` to open, `/` to search.
- **Search trackers** from Daily Goals (Strides search is in the list, not only Add Tracker).

## Daily Goals list

- **Time-of-day / reminder chips** on the row (morning, 8:00 AM).
- **Every X days** in the subtitle and date-strip due logic. `repeatInterval` exists in the database and due-date math; the create/settings UI still only exposes daily / weekly / monthly.
- **Custom weekday sets** shown as “M W F” in the row subtitle, not only “Weekly”.
- **Folded sections** (tap Due / Missed / Done to collapse).
- **Empty missed/done copy** that matches Strides when a filter is on (“No Health goals due”).
- **Partial-day pie** for “3 times per day” that fills in thirds as you tap, including a number in the circle.
- **Bad-habit row treatment**: redder missed state, “Did it” vs “Resisted” labels on the swipe buttons in more places.
- **Project rows**: tappable milestone list that doesn’t steal the row swipe; completion ring that opens the project, not a dead circle.

## Tracker detail

- **Edit a history log in place** (change value/note/date). History is swipe-to-delete only.
- **Calendar intensity** by value (darker green for bigger logs), skip-as-grey, future days muted.
- **Month/year/all range** on the Charts tab, not only the last 14 bars + current month.
- **Log sheet date stepper** (‹ Tue, Aug 25 ›) instead of relying on the heatmap.
- **Notes**: rich text is not needed, but a last-edited timestamp and per-day notes on the calendar would match Strides more closely.
- **Share sheet**: image of the chart/ring, not only `navigator.share` of a text line.
- **Duplicate tracker** and **pause / vacation mode**.
- **Start Over** confirmation sheet (destructive iOS action sheet, not `window.confirm`).
- **Target pace chart** with fill under the line, axis labels, and tap-to-inspect a point.

## Create / settings

- **Every X days / weeks / months** stepper on step 3.
- **Times per week** as a first-class habit option (Strides “X times per week”).
- **Icon picker** beyond the small emoji grid (search, categories).
- **Onboarding** for a first empty database (Strides-style coach marks, not only “Load sample data”).
- **Week starts on** (Sunday vs Monday) as a setting; date strip, heatmap, and weekly due logic should all honor it.
- **Archive list** as its own grouped screen, not mixed into reorder.
- **App lock** (optional PIN) for the desktop app.
- **Default landing tab** and “carry yesterday’s missed into today” toggle.

## Reports

- **Trends** that match Strides’ stacked week/month charts more closely (labels, selection, goal line).
- **Rankings** medals already exist; add sort (streak / rate / name) and a trophy case.
- **Calendar tab**: tap a day to jump to Daily Goals on that date.
- **Filter badge** on Reports when a tag or non-default period is active (Daily Goals already dots the sliders icon).
- **Export chart** as PNG.

## Platform features Strides has (not chrome)

These are product features, not pixel tweaks. They are the largest remaining distance from Strides.

- **Reminders and local notifications** (Electron + OS; web: Notification API with caveats).
- **Dark mode** and true black OLED option. The app is locked to light iOS grouped grey.
- **iCloud / account sync**. Leaps is one local SQLite file; no multi-device sync.
- **Apple Health / Google Fit** read/write.
- **Home screen widgets** and **menu-bar extra** for today’s checks.
- **Apple Watch / Wear OS** companion.
- **Accountability partners** and shared trackers.
- **Siri / system shortcuts** (“Log water”).
- **CSV export** in addition to JSON.
- **Photo attachments** on logs.
- **Location reminders**.
- **Year in review / wrapped**.

## Visual leftovers

Small things that still give away the clone if you sit the two apps side by side:

- SF Pro is used only as a fallback; most desktops render Segoe/Roboto. Shipping a licensed SF-like stack or a closer Inter/SF compact pairing would help.
- Tab bar selected icons are filled Lucide glyphs, not the Strides custom assets.
- Navy header gradient is close, not sampled from a device screenshot under the same wallpaper.
- Log keypad is a 3×4 grid, not the iOS calculator layout with a wide 0.
- Number fields still use the OS stepper/keyboard on create/settings rather than the same keypad.
- Modal sheets don’t drag to dismiss (grabber is visual only).
- No large-title collapse on scroll.
- No reduced-motion / Dynamic Type.
- Localization (Strides ships many languages; Leaps is en-US copy).
- Electron window chrome (traffic lights vs hidden title bar) still varies by OS.

## Engineering

- **Tests** for calendar-date logging, notes debounce, and filter-badge rendering (chrome tests today assert source strings).
- **Optimistic heatmap updates** so tapping a day doesn’t wait on the round trip.
- **Conflict-free log edits** if sync is ever added.
- **Migration** if `repeatInterval` UI is exposed, so existing trackers stay daily.
- **Accessibility**: the check circle, swipe row, and heatmap need better names and keyboard operation.

## Suggested next slices

1. **Reminders + dark mode** — the two features people notice first when comparing to Strides.
2. **Every-X-days UI + week-start setting** — data model is already there.
3. **History edit + undo toast + long-press skip** — finishes the logging loop.
4. **Sync** — only after the local file format is treated as a real backup (CSV, versioned JSON).
