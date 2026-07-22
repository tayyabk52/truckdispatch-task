# Complete User Flows — Trip Planner & ELD Log Generator

Below are the end-to-end flows a real user will experience in the final delivery, plus alternate/edge-case flows. Each flow shows: entry point → user action → system behavior → expected output on screen.

---

## 0. Personas

- **Driver Dan** — property-carrying CMV driver, needs to plan today's trip and produce compliant paper logs.
- **Dispatcher Dana** — plans trips on behalf of a driver, prints logs for the driver's book.
- **Reviewer Rita** — the assessor grading the submission; wants to test accuracy quickly.

All three use the same UI. No auth is required for the graded demo (keeps friction low). A "Driver profile" panel lets them optionally save carrier/truck details in localStorage so they don't retype.

---

## 1. Site Map

```
/                         → Landing + Trip Input Form (single-page CTA)
/trips/:id                → Trip Results (map + summary + logs)
/trips/:id/logs           → Log Sheets full-screen viewer
/trips/:id/logs/:date     → Deep link to a specific day
/trips/:id/logs.pdf       → Direct PDF download
/history                  → Recent trips (from localStorage)
/about                    → HOS rules explainer (credibility page)
```

---

## 2. Primary Flow — "Plan my trip and give me logs"

### Step 1 — Landing / Trip Input (`/`)

**What the user sees**
- Hero: "Plan your trip. Get compliant ELD logs. In seconds."
- Single card form with the 4 required inputs plus an "Advanced" expander.
- Small legend: "Assumes property-carrying driver, 70 hrs / 8 days, no adverse conditions, fuel every 1,000 mi, 1 hr pickup + drop-off."

**Form fields**
| Field | Widget | Validation |
|---|---|---|
| Current location | Address autocomplete | Required, must resolve to lat/lng |
| Pickup location | Address autocomplete | Required |
| Drop-off location | Address autocomplete | Required |
| Current cycle used (hrs) | Number, 0–70, step 0.25 | Required |
| Trip start (date/time) | Datetime, defaults to *now* in driver's TZ | Required |
| ▸ Advanced (collapsed) | Driver name, carrier, main office, truck #, trailer #, co-driver, shipper, commodity, BOL # | All optional |

**User action:** Fills fields → clicks **"Plan Trip"**.

**System behavior**
1. Client-side validation (all required, cycle 0–70, dropoff ≠ pickup).
2. `POST /api/trips/` with the payload.
3. Full-page loading state: "Routing… Applying HOS rules… Drawing logs…" with a 3-step progress indicator.
4. On success → redirect to `/trips/:id`.

**Expected output at this stage:** a trip is created in the DB with route geometry, `RouteStop`s, `DutyStatusEvent`s, and `DailyLog`s.

---

### Step 2 — Trip Results (`/trips/:id`)

Landing view has three stacked sections (desktop: 2-column at `md:`).

#### 2a. Summary bar (top)
- Total distance (mi)
- Total driving time (hh:mm)
- Total trip duration (hh:mm, including breaks + rests)
- Estimated ETA (driver's TZ)
- # of daily logs generated
- # of fuel stops
- Cycle hours used at end of trip (e.g. "58.5 / 70")
- Buttons: **Download all logs (PDF)** · **Share link** · **New trip**

#### 2b. Map panel (left / top on mobile)
- Leaflet map, OSM tiles.
- Full route polyline.
- Color-coded markers:
  - 🟢 Origin
  - 🔵 Pickup
  - 🟣 Drop-off
  - ⛽ Fuel stops
  - ☕ 30-min breaks
  - 🛏️ 10-hr rest / sleeper berth locations
  - 🔄 34-hr restart (if any)
- Click a marker → popup with: type, arrival, departure, duration, cumulative miles, remaining HOS clocks at that point.
- "Fit to route" and "Center on next stop" controls.

#### 2c. Timeline strip (below map)
- Horizontal Gantt-style bar showing the full trip duty statuses (Off / Sleeper / Driving / On-Duty).
- Vertical dashed lines mark midnight (home-terminal TZ) — makes it obvious where daily logs split.
- Hover a segment → tooltip with times, location, remark.

#### 2d. Log Sheets carousel (right / bottom on mobile)
- Tabs: "Day 1 (Mon 07/21)" · "Day 2 (Tue 07/22)" · …
- Each tab renders the day's log as inline SVG (exact FMCSA layout: header, 4-row grid, remarks, totals column, recap).
- Under each log: **Download this day (PDF)** button.
- "Open full viewer" button → `/trips/:id/logs`.

**Expected output:** the user can visually verify the route and HOS accuracy in under 30 seconds, and can download a printable PDF that a driver could actually carry.

---

### Step 3 — Log Sheets Full Viewer (`/trips/:id/logs`)

- Larger, print-styled view of each day's log, one per screen.
- Prev / Next arrows + keyboard shortcuts.
- **Download all (PDF)** and **Download this day (PDF)**.
- Print-CSS so browser print produces exactly one physical page per log.

**Expected output:** driver-ready printable logs.

---

## 3. Alternate Flow A — Trip fits in a single shift (< 11 hrs driving, < 14 hr window)

**When:** short trip like Chicago → Milwaukee.

**System behavior**
- No 10-hr rest inserted.
- One 30-min break inserted if cumulative driving ≥ 8 hrs (usually skipped for short trips).
- Fuel stop only if driving distance > 1,000 mi (usually skipped).
- Pickup + drop-off (1 hr each) still inserted.

**Expected output**
- **One** daily log sheet.
- Timeline: On Duty (pre-trip) → Driving → On Duty (pickup) → Driving → On Duty (drop-off) → Off Duty.
- Summary: "1 daily log, 0 fuel stops, 0 required rests."

---

## 4. Alternate Flow B — Multi-day trip forcing one or more 10-hr resets

**When:** e.g. Los Angeles → Dallas (~1,400 mi).

**System behavior**
- Driver hits the 11-hr driving limit or 14-hr window → planner inserts a 10-hr sleeper-berth block.
- On resumption, both 11-hr and 14-hr clocks reset.
- Fuel stop inserted around mile 1,000.
- Duty events crossing midnight are split at midnight (home-terminal TZ) so each day's grid closes at exactly 24 hrs.

**Expected output**
- **2–3** daily log sheets.
- Map: at least one 🛏️ marker at the rest location; one ⛽ marker mid-route.
- Timeline shows the sleeper-berth blocks clearly.
- Each log's totals column sums to 24.

---

## 5. Alternate Flow C — Driver starts with high cycle-hours used (near 70)

**When:** user enters `Current cycle used = 65 hrs`, and the trip needs > 5 driving hours.

**System behavior**
- Planner tracks the 70-hr cap. Once cumulative on-duty crosses 70, driving is blocked.
- Planner inserts a **34-hr restart** (as sleeper-berth + off-duty) before continuing.
- After the restart, cycle-hours reset to 0.

**Expected output**
- Summary warning banner: **"Cycle limit reached — 34-hr restart inserted before trip completion."**
- Map has a 🔄 marker showing the restart location (nearest safe rest area on the route; for the demo we use the point where 70 hrs is hit).
- Extra daily logs cover the restart period (mostly Off Duty + Sleeper Berth).
- README explains this behavior as a v1 simplification.

---

## 6. Alternate Flow D — Same location for pickup and drop-off (round trip) or Current = Pickup

**When:** driver is already at the pickup location, or trip returns to origin.

**System behavior**
- If `current == pickup`: skip Leg 1 driving; go straight to the 1-hr pickup on-duty block.
- If `pickup == dropoff`: return `422` with a validation error ("Pickup and drop-off must differ").
- If `current == dropoff`: allowed — treated as a there-and-back.

**Expected output**
- Either a valid plan starting with an on-duty pickup event, or a form-level inline error message on the input page.

---

## 7. Alternate Flow E — Address cannot be geocoded

**When:** user types a nonsense address, or geocoder returns 0 hits.

**System behavior**
- Autocomplete shows "No results" beneath the field.
- Submit button disabled until all three fields have a resolved lat/lng.
- If autocomplete is skipped (paste + submit) and geocoder fails server-side → API returns `422` with `{field: "pickup_location", message: "Could not locate this address"}`.

**Expected output:** inline red error under the offending field, no partial trip is saved.

---

## 8. Alternate Flow F — Routing API fails or times out

**When:** ORS/OSRM is down or rate-limited.

**System behavior**
- Backend retries once with exponential backoff.
- If still failing, `POST /api/trips/` returns `503` with `{error: "Routing service unavailable, please retry"}`.
- Frontend shows a toast: "Couldn't fetch route. Try again." with a **Retry** button that reposts the same payload.
- No trip row is committed (transaction rolled back).

---

## 9. Alternate Flow G — User revisits an old trip

**When:** user opens `/trips/:id` from a bookmark or a shared link.

**System behavior**
- `GET /api/trips/:id/` fetches the pre-computed plan (route, stops, events, logs).
- No re-planning — trips are immutable once created.
- If the ID doesn't exist → 404 page with a "Start a new trip" button.

**Expected output:** the same results view as after initial plan, instantly (no loading spinner).

---

## 10. Alternate Flow H — PDF download

**Two entry points:** "Download all logs" (top of results) and "Download this day" (per tab).

**System behavior**
- Client hits `GET /api/trips/:id/logs.pdf` (or `/logs/:date.pdf`).
- Backend either serves a cached `DailyLog.generated_pdf` file or regenerates on the fly (WeasyPrint, SVG → PDF).
- Response has `Content-Disposition: attachment; filename="eld-logs-2026-07-21.pdf"`.

**Expected output:** browser download prompt; PDF opens with one page per day, each page visually identical to the on-screen SVG.

---

## 11. Alternate Flow I — Mobile viewing

**When:** user is on a phone (≤ 400 px width).

**System behavior**
- Single-column layout: form stacks vertically.
- Results page: summary → map → timeline → logs (each full-width).
- Log sheets shown in a horizontal swipe carousel; pinch-zoom enabled on SVG.
- PDF download works identically.

**Expected output:** fully usable trip planning on a phone in the cab.

---

## 12. Alternate Flow J — Recent trips (`/history`)

**When:** user has planned trips before on this device.

**System behavior**
- `/history` reads `trip_ids` from localStorage.
- Fetches each in parallel, renders a table: date, origin → dropoff, miles, # logs, link.

**Expected output:** quick re-access to prior work; not persisted server-side beyond the trip row itself.

---

## 13. What "Expected Output" Looks Like Across the Full Journey

| Stage | Artifact user gets |
|---|---|
| After submitting form | A route plan (in DB) and a URL to view it |
| On results page | Map with route + all stops, summary metrics, timeline, per-day log SVGs |
| Per day tab | An exact-layout Driver's Daily Log grid with 4 rows filled, remarks labeled with city/state, totals row summing to 24, recap block populated |
| PDF download | Multi-page PDF, one page per daily log, print-ready |
| Share link | `/trips/:id` — anyone with the link sees the same immutable plan |

---

## 14. Error / Empty States Checklist (must all be designed)

- Empty form (first visit) — friendly hero + example addresses hint.
- Field-level validation errors (inline red text).
- Geocoding: "No results" in autocomplete.
- API 5xx: full-page fallback with retry.
- Trip not found (404).
- PDF generation failure: toast + retry.
- Very long trip (> 8 days) — banner: "This trip spans more than 8 days and will require restarts; verify with dispatcher."
- Slow network: skeleton loaders on map and log tabs.

---

## 15. Accessibility & Polish (per the "UI/UX must be good" bar)

- Full keyboard nav on the form and log tabs.
- Semantic headings, ARIA labels on map markers.
- Dark-mode aware colors (route polyline + log grid ink adapt).
- Print stylesheet for the log viewer (`@media print`).
- Loading skeletons, success toasts, sensible focus rings.
- Copy tone: concise, professional, no jargon dumps.

---

Want me to now scaffold the repo (Phase 0 + 1) and draft the trip-input form + a routing service stub, or start with the HOS planner unit-test cases so the core logic is proved first?