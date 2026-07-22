# Trip Planner & ELD Log Generator — Project Plan

Built from: assessment doc (Django + React, trip inputs → route + ELD logs), FMCSA HOS Guide (April 2022), the Schneider log-book walkthrough, and the blank Driver's Daily Log template.

---

## 1. Project Summary

A full-stack web app where a driver enters trip inputs and receives:
- A **map** with the full route, fueling stops, mandatory rest breaks, pickup and drop-off.
- One or more **filled-out Driver's Daily Log sheets** (the FMCSA/DOT paper log grid), drawn programmatically, one per 24-hour period spanned by the trip.

**Stack:** Django + Django REST Framework (backend), React (frontend), PostgreSQL (recommended) or SQLite (dev), free map API (OpenRouteService, OSRM, or Mapbox free tier), deployed on Vercel (frontend) + Render/Railway/Fly.io (Django backend + DB).

**Hard assumptions (from the brief):**
- Property-carrying driver, **70 hrs / 8 days** cycle.
- No adverse driving conditions.
- **Fuel stop every ≤ 1,000 miles.**
- **1 hour** on-duty (not driving) each for pickup and drop-off.

---

## 2. Functional Requirements

### 2.1 Inputs (from the user)
| Field | Type | Notes |
|---|---|---|
| Current location | Address / lat-lng (geocoded) | Starting point of the driver |
| Pickup location | Address / lat-lng | Where the load is picked up |
| Drop-off location | Address / lat-lng | Where the load is delivered |
| Current cycle used (hrs) | Number 0–70 | Hours already used in the rolling 8-day cycle |
| (optional) Driver name, carrier name, main office address, truck/trailer numbers, co-driver, shipper name, commodity, BOL/manifest # | Text | Populated onto every log sheet; if blank, use sensible defaults |
| (optional) Trip start date/time | Datetime | Defaults to "now" in driver's local TZ |

### 2.2 Core computational engine (HOS + trip planner)

Must respect all limits below (all sourced from the FMCSA guide):

1. **11-hour driving limit** per shift (§ 395.3(a)(3)).
2. **14-hour driving window** — no driving after the 14th hour since coming on duty (§ 395.3(a)(2)).
3. **30-minute break** required after 8 cumulative driving hours (§ 395.3(a)(3)(ii)).
4. **10 consecutive hours off duty** required to reset 11-hr and 14-hr clocks.
5. **70-hour / 8-day** on-duty cap (rolling window) — starting seed value = "Current Cycle Used".
6. **34-hour restart** (optional) if driver runs out of 70-hour budget mid-trip.
7. **Pickup**: 1 hour on-duty (not driving) at pickup location.
8. **Drop-off**: 1 hour on-duty (not driving) at drop-off location.
9. **Fueling**: insert a ~15-min on-duty stop every ≤ 1,000 miles of driving.

The engine steps time forward minute-by-minute (or segment-by-segment) along the route and inserts duty-status changes wherever a limit is about to be hit.

### 2.3 Outputs

**A. Route map**
- Full polyline from current → pickup → drop-off.
- Markers: origin, pickup, drop-off, each fuel stop, each 30-min break, each 10-hr rest.
- Popup/tooltip on each marker: type, arrival time, duration, cumulative miles, remaining HOS clocks.

**B. Trip summary panel**
- Total distance, total driving time, total trip duration, number of daily logs generated, estimated fuel stops, ETA.

**C. Daily Log Sheets (one per calendar day)**
- Exact FMCSA layout: header fields, 4-row 24-hour grid (Off Duty / Sleeper Berth / Driving / On Duty (Not Driving)), Remarks section, totals column, shipping doc box.
- Duty-status line drawn as horizontal segments with vertical connectors at each status change (the pattern shown in the Schneider walkthrough and the "Completed Log" example on p. 19 of the FMCSA PDF).
- Remarks: city, state, and reason (pre-trip, fueling, pickup, 30-min break, sleeper berth, drop-off, post-trip) at each status change.
- Total hours per row on the right side; row totals sum to 24.
- Downloadable as PDF.

---

## 3. Deliverables (per the assessment)

1. **Live hosted app** (Vercel for React; Render/Railway for Django + Postgres).
2. **Public GitHub repo** with README (setup, env vars, architecture, HOS logic explanation).
3. **3–5 min Loom** walking through the UI and the code.
4. **Working end-to-end flow** with visible HOS accuracy (verifiable against the FMCSA rules).
5. Polished UI/UX — clean typography, responsive layout, obvious CTAs, loading and error states.

---

## 4. System Architecture

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   React (Vercel)    │ HTTPS   │   Django + DRF (Render)      │
│  - Trip form        │◄───────►│  - /api/trips  (POST)        │
│  - Map (Leaflet)    │  JSON   │  - /api/trips/<id> (GET)     │
│  - Log sheet viewer │         │  - /api/trips/<id>/logs.pdf  │
│  - PDF download btn │         │                              │
└─────────────────────┘         │  Services:                   │
                                │   • GeocodingService         │
                                │   • RoutingService (ORS/OSRM)│
                                │   • HOSPlanner (pure Python) │
                                │   • LogSheetRenderer         │
                                │       (SVG → PDF via         │
                                │        ReportLab/WeasyPrint) │
                                └──────────┬───────────────────┘
                                           │
                                     ┌─────▼──────┐
                                     │ PostgreSQL │
                                     └────────────┘
```

**Free map/routing APIs to choose from:**
- **OpenRouteService** — free tier, gives distance + duration + geometry + turn-by-turn. Recommended.
- **OSRM public demo server** — no key, but not for production.
- **Mapbox free tier** — polished but requires token.
- **Leaflet + OpenStreetMap tiles** for rendering (no key needed).

---

## 5. Database Requirements

PostgreSQL (or SQLite locally). Django models:

### `Driver`
| Field | Type |
|---|---|
| id | PK |
| name | CharField |
| license_number | CharField (optional) |
| carrier_name | CharField |
| carrier_main_office | CharField |
| home_terminal_tz | CharField (IANA tz, e.g. "America/Chicago") |
| created_at | DateTime |

### `Vehicle`
| Field | Type |
|---|---|
| id | PK |
| truck_number | CharField |
| trailer_number | CharField (nullable) |
| license_plate | CharField |
| license_state | CharField(2) |

### `Trip`
| Field | Type |
|---|---|
| id | PK / UUID |
| driver | FK → Driver (nullable for anonymous demos) |
| vehicle | FK → Vehicle (nullable) |
| current_location_label | CharField |
| current_location_lat, current_location_lng | Float |
| pickup_label, pickup_lat, pickup_lng | CharField / Float |
| dropoff_label, dropoff_lat, dropoff_lng | CharField / Float |
| current_cycle_used_hours | Float |
| start_datetime | DateTimeField (tz-aware) |
| total_distance_miles | Float |
| total_driving_minutes | Integer |
| total_trip_minutes | Integer |
| route_geometry | JSONField (encoded polyline or GeoJSON LineString) |
| shipper_name, commodity, bol_number | CharField (nullable) |
| created_at | DateTime |

### `RouteStop`
Ordered stops along the trip (pickup, dropoff, fuel, break, sleeper, off-duty rest).
| Field | Type |
|---|---|
| id | PK |
| trip | FK → Trip |
| sequence | Integer |
| stop_type | Enum: `origin, pickup, dropoff, fuel, break_30min, rest_10hr, restart_34hr, post_trip` |
| label | CharField (e.g. "Fredericksburg, VA") |
| lat, lng | Float |
| arrival_time | DateTimeField |
| departure_time | DateTimeField |
| duration_minutes | Integer |
| cumulative_miles | Float |
| notes | Text |

### `DutyStatusEvent`
The atomic timeline used to draw the grid.
| Field | Type |
|---|---|
| id | PK |
| trip | FK → Trip |
| start_time | DateTimeField |
| end_time | DateTimeField |
| status | Enum: `off_duty, sleeper_berth, driving, on_duty_not_driving` |
| location_label | CharField |
| lat, lng | Float |
| remark | Text (e.g. "Fueling", "Pre-trip inspection", "Pickup", "30-min break") |

### `DailyLog`
One row per 24-hour period.
| Field | Type |
|---|---|
| id | PK |
| trip | FK → Trip |
| log_date | DateField (in home-terminal TZ, per FMCSA rule) |
| total_miles_driving_today | Integer |
| total_off_duty | Decimal(4,2) |
| total_sleeper_berth | Decimal(4,2) |
| total_driving | Decimal(4,2) |
| total_on_duty_not_driving | Decimal(4,2) |
| shipping_doc_number | CharField |
| driver_signature | CharField (typed name is fine for demo) |
| generated_svg | TextField (optional cache) |
| generated_pdf | FileField (optional cache) |

*(A `DailyLog` row aggregates the `DutyStatusEvent` rows that fall inside its 24-hour window at the home-terminal timezone.)*

---

## 6. HOS Planning Algorithm (pseudocode)

```python
def plan_trip(inputs):
    route = routing.get_route(current → pickup → dropoff)
    # route is a sequence of (lat, lng, cumulative_miles) samples

    events = []
    clock = TripClock(
        cycle_used = inputs.current_cycle_used_hours,
        shift_driving = 0, shift_window = 0,
        driving_since_break = 0,
        now = inputs.start_datetime,
    )

    # Leg 1: current → pickup (driving)
    drive_leg(events, clock, route[0:pickup_idx], reason="to pickup")
    add_on_duty(events, clock, 60, reason="Pickup", loc=pickup)

    # Leg 2: pickup → dropoff (driving), with fuel stops every 1000 mi
    drive_leg(events, clock, route[pickup_idx:end], reason="to dropoff",
              fuel_every_miles=1000)
    add_on_duty(events, clock, 60, reason="Drop-off", loc=dropoff)

    return events


def drive_leg(events, clock, samples, reason, fuel_every_miles=None):
    for segment in samples:
        # Before driving this segment, check every clock:
        if clock.driving_since_break >= 8*60:
            insert_break_30min(events, clock)
        if clock.shift_driving >= 11*60 or clock.shift_window >= 14*60:
            insert_10hr_reset(events, clock)      # sleeper berth
        if clock.cycle_used >= 70*60:
            insert_34hr_restart(events, clock)
        if fuel_every_miles and clock.miles_since_fuel >= fuel_every_miles:
            insert_fuel_stop(events, clock, 15)   # on-duty not driving
        drive_one_segment(events, clock, segment)
```

Every `insert_*` call closes the previous `DutyStatusEvent`, opens a new one with the right status, updates location, and advances/resets the appropriate clocks per the FMCSA rules.

---

## 7. Log-Sheet Generation

**Layout** matches the uploaded `blank-paper-log.png` and page 15 of the FMCSA PDF:

- Header: date, total miles, carrier name, main office, truck/trailer, co-driver, signature.
- 24-hour grid, 4 rows (Off Duty / Sleeper Berth / Driving / On Duty Not Driving), each hour divided into 15-min ticks.
- Remarks strip beneath the grid — city/state labels at each duty change, drawn diagonally like the FMCSA example.
- Totals column on the right — each row's total, and grand total = 24.
- Recap block at the bottom (70-hour / 8-day math).

**Rendering approach — recommended: SVG first, then PDF.**

1. **Generate SVG server-side** using a template with fixed geometry (constants for grid cell width, row height, tick positions).
2. For each `DutyStatusEvent` in the day:
   - Compute `x_start = ((start_time - midnight_home_tz) / 24h) * grid_width`.
   - Compute `x_end` similarly.
   - Compute `y = row_y[status]`.
   - Draw a horizontal `<line>` from `(x_start, y)` to `(x_end, y)`.
   - At each transition to the next status, draw a vertical `<line>` from old row to new row.
3. In the Remarks band, place each transition's `"City, ST"` label at `x_start`, rotated ~60° like the FMCSA "Completed Log" example.
4. Fill the totals column by summing minutes per status per day (converted to decimal hours like `10.5` and rounded to nearest 15 min — per the Schneider transcript).
5. **Convert SVG → PDF** with **WeasyPrint** or **ReportLab**. Multi-page PDF = one page per `DailyLog`.
6. Ship the SVG to the React frontend for on-screen preview, and expose a `GET /api/trips/<id>/logs.pdf` endpoint for download.

**Multiple-day handling:** any `DutyStatusEvent` that crosses midnight (in home-terminal TZ) is split into two events at midnight so each day's grid closes cleanly.

---

## 8. API Design (Django REST Framework)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/trips/` | Submit inputs, run planner, return trip_id + full plan |
| GET | `/api/trips/<id>/` | Full trip: route geometry, stops, duty events, daily summaries |
| GET | `/api/trips/<id>/route/` | Route geometry only (for map) |
| GET | `/api/trips/<id>/logs/` | JSON of all daily logs + duty events |
| GET | `/api/trips/<id>/logs.pdf` | Downloadable multi-page PDF |
| GET | `/api/trips/<id>/logs/<date>.svg` | Single day SVG for inline preview |

---

## 9. Frontend (React) Pages

1. **`/`** — Trip Input Form
   - Address autocomplete (Nominatim or ORS geocode).
   - Cycle-hours input with helper text ("out of 70").
   - Optional driver/carrier/BOL fields (collapsible).
   - "Plan Trip" button → POST → redirect to `/trips/:id`.

2. **`/trips/:id`** — Results
   - **Map panel** (Leaflet + OSM tiles): route polyline, color-coded stops, hover cards.
   - **Summary card**: total miles, driving time, # days, ETA, # fuel stops.
   - **Timeline strip**: horizontal Gantt of duty statuses across the whole trip.
   - **Log Sheets tab**: paginated day-by-day SVG preview, "Download All PDFs" button.

3. **Design pass**: neutral palette, clear hierarchy, mobile-friendly, empty/loading/error states.

---

## 10. Phase-by-Phase Implementation

### **Phase 0 — Setup (Day 1, ~4h)**
- Init repo, monorepo layout: `/backend` (Django), `/frontend` (React/Vite).
- Django project + DRF + CORS, base models scaffolded.
- React app scaffolded with router + fetch client.
- Deploy skeleton to Vercel + Render early (deploy-first, iterate).

### **Phase 1 — Data model + Admin (Day 1–2, ~4h)**
- Implement all models above with migrations.
- Django admin registered so results are inspectable.
- Seed a couple of fixture drivers/vehicles for demo.

### **Phase 2 — Geocoding + Routing (Day 2, ~4h)**
- Wrap ORS (or OSRM) in `services/routing.py`.
- Endpoint: given 3 addresses → return distance, duration, geometry.
- Unit test with a known trip (e.g. Richmond VA → Newark NJ, the FMCSA example).

### **Phase 3 — HOS Planner (Day 3–4, ~8h) — the core**
- Implement `TripClock` and `plan_trip` (see pseudocode above).
- Rules covered: 11-hr driving, 14-hr window, 30-min break at 8 cum. driving hrs, 10-hr reset, 70-hr/8-day cap w/ seed value, 34-hr restart, 1-hr pickup, 1-hr dropoff, fuel every ≤1000 mi.
- **Unit tests** for each rule with hand-crafted scenarios (a short trip that never trips a limit, a trip that forces one 10-hr rest, a trip that forces a 34-hr restart, etc.).

### **Phase 4 — Log Sheet Renderer (Day 4–5, ~6h)**
- SVG template matching the FMCSA layout.
- Function: `render_daily_log(daily_log) → svg_string`.
- `render_trip_pdf(trip) → pdf_bytes` via WeasyPrint (SVG → HTML wrapper → PDF).
- Verify visually against the "Completed Log" on p. 19 of the FMCSA PDF and the uploaded blank template.

### **Phase 5 — REST API (Day 5, ~3h)**
- Wire endpoints from section 8.
- Serializers for `Trip`, `RouteStop`, `DutyStatusEvent`, `DailyLog`.

### **Phase 6 — React UI (Day 6–7, ~10h)**
- Trip input form + validation.
- Results page: Leaflet map, stops legend, timeline, log-sheet carousel/tabs.
- Download PDF button.
- Design polish (typography, spacing, colors, empty/loading/error states, mobile).

### **Phase 7 — E2E test + Deploy (Day 8, ~4h)**
- Test full flow against 3 real trip scenarios (short intra-state, cross-country ≥ 3 days, edge-case starting with 65 cycle hours used).
- Deploy final versions.
- Record 3–5 min Loom, push README, submit.

**Total: ~40–45 focused hours.**

---

## 11. Testing Strategy

- **Unit tests** for `HOSPlanner`: one per rule, plus combinations.
- **Snapshot test** of the "John Doe Richmond → Newark" example from the FMCSA guide — the generated log grid should visually match the reference.
- **Integration test**: POST a trip → assert JSON contains expected # of DailyLogs, sum of driving = route duration, all HOS constraints respected.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Free routing APIs rate-limit | Cache route responses per (origin, pickup, dropoff) hash; ORS free key gets 2k req/day, plenty for a demo |
| PDF rendering is fiddly | Start with clean SVG; use WeasyPrint (best HTML/SVG → PDF) rather than reinventing coord math in ReportLab |
| Timezone edge cases (midnight splits) | Store all datetimes UTC; only convert to `driver.home_terminal_tz` when slicing days for logs |
| 70-hour rolling window across days that pre-date the trip | Seed the cycle with `current_cycle_used_hours` and decay it correctly (we don't have historical days — treat the seed as "hours already used, will drop off after 8 days from now") |
| Sleeper-berth split provision (7+3 or 8+2) | Out of scope for v1 per the assumptions ("no adverse driving, standard 70/8"). Note in README as future work. |

---

Want me to start scaffolding the repo now (Phase 0 + 1) or draft the HOS planner unit-test cases first?