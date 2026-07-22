"""
FMCSA-compliant Driver's Daily Log SVG renderer.

Generates an SVG matching the standard DOT paper log form layout:
- Header band with driver/carrier/vehicle info
- 24-hour grid (Midnight-Noon-Midnight) with 15-min tick marks
- 4 rows: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving)
- Duty status line (horizontal segments + vertical connectors)
- Totals column (must sum to 24.00)
- Remarks section with location at each duty change
- Recap section (70-hr/8-day)
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

# --- Layout constants (viewBox: 0 0 1200 780) ---
SVG_W = 1200
SVG_H = 780

# Grid geometry
GRID_X = 150  # left edge of 24-hr grid
GRID_W = 960  # 40px per hour * 24 hours
GRID_RIGHT = GRID_X + GRID_W  # 1110

# Time header
TIME_HEADER_Y = 115  # baseline for hour numbers

# Grid rows (4 rows, 50px each)
GRID_TOP = 130
ROW_H = 50
ROW_MIDLINES = {
    "off_duty": GRID_TOP + ROW_H * 0 + ROW_H // 2,          # 155
    "sleeper_berth": GRID_TOP + ROW_H * 1 + ROW_H // 2,     # 205
    "driving": GRID_TOP + ROW_H * 2 + ROW_H // 2,           # 255
    "on_duty_not_driving": GRID_TOP + ROW_H * 3 + ROW_H // 2,  # 305
}
GRID_BOTTOM = GRID_TOP + ROW_H * 4  # 330

# Totals column
TOTALS_X = GRID_RIGHT + 10  # 1120

# Remarks section
REMARKS_Y = 355
REMARKS_H = 130

# Recap section
RECAP_Y = 500

# Colors
COLOR_GRID_LINE = "#333333"
COLOR_GRID_LIGHT = "#999999"
COLOR_TICK = "#cccccc"
COLOR_DUTY_LINE = "#000000"
COLOR_HEADER_BG = "#f5f5f5"
COLOR_ROW_ALT = "#fafafa"

# Row labels
ROW_LABELS = [
    "1. Off Duty",
    "2. Sleeper Berth",
    "3. Driving",
    "4. On Duty (Not Driving)",
]

STATUS_ORDER = ["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"]


def _time_to_x(hour: float) -> float:
    """Convert fractional hour (0-24) to x coordinate."""
    return GRID_X + (hour / 24.0) * GRID_W


def _status_to_y(status: str) -> int:
    """Convert duty status to y coordinate (midline of row)."""
    return ROW_MIDLINES.get(status, ROW_MIDLINES["off_duty"])


def _escape_xml(text: str) -> str:
    """Escape special XML characters."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _format_hours(hours) -> str:
    """Format decimal hours as H:MM string."""
    h = float(hours)
    whole = int(h)
    mins = int(round((h - whole) * 60))
    return f"{whole}:{mins:02d}"


def render_daily_log_svg(
    log_date: date,
    duty_events: list[dict],
    total_miles: int = 0,
    total_off_duty: float = 0,
    total_sleeper_berth: float = 0,
    total_driving: float = 0,
    total_on_duty_nd: float = 0,
    driver_name: str = "",
    co_driver: str = "",
    carrier_name: str = "",
    main_office: str = "",
    truck_number: str = "",
    trailer_number: str = "",
    bol_number: str = "",
    home_tz: str = "America/Chicago",
    cycle_hours_today: float = 0,
    cycle_hours_7day: float = 0,
) -> str:
    """
    Render a complete FMCSA-compliant Driver's Daily Log as SVG.

    Args:
        log_date: The date this log covers
        duty_events: List of dicts with keys: start_time, end_time, status, location_label, remark
                     Times should be datetime objects or ISO strings
        total_miles: Total miles driven this day
        total_off_duty: Hours off duty (Decimal or float)
        total_sleeper_berth: Hours in sleeper berth
        total_driving: Hours driving
        total_on_duty_nd: Hours on duty not driving
        driver_name: Driver's full name
        co_driver: Co-driver name
        carrier_name: Motor carrier name
        main_office: Carrier main office address
        truck_number: Truck/tractor number
        trailer_number: Trailer number(s)
        bol_number: Bill of lading / manifest number
        home_tz: IANA timezone string
        cycle_hours_today: On-duty hours today (for recap)
        cycle_hours_7day: Cumulative 7-day on-duty hours (for recap)

    Returns: Complete SVG string
    """
    tz = ZoneInfo(home_tz)
    parts = []

    # SVG header
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}" '
        f'width="{SVG_W}" height="{SVG_H}" '
        'font-family="Arial, Helvetica, sans-serif" font-size="11">'
    )

    # Background
    parts.append(f'<rect width="{SVG_W}" height="{SVG_H}" fill="white"/>')

    # --- HEADER SECTION ---
    parts.append(_render_header(log_date, total_miles, driver_name, co_driver,
                                carrier_name, main_office, truck_number,
                                trailer_number, bol_number))

    # --- GRID SECTION ---
    parts.append(_render_grid())

    # --- DUTY STATUS LINE ---
    parts.append(_render_duty_line(duty_events, log_date, tz))

    # --- TOTALS COLUMN ---
    parts.append(_render_totals(total_off_duty, total_sleeper_berth,
                                total_driving, total_on_duty_nd))

    # --- REMARKS SECTION ---
    parts.append(_render_remarks(duty_events, log_date, tz))

    # --- RECAP SECTION ---
    parts.append(_render_recap(cycle_hours_today, cycle_hours_7day, total_driving,
                               total_on_duty_nd))

    # --- CERTIFICATION ---
    parts.append(_render_certification(driver_name))

    parts.append("</svg>")
    return "\n".join(parts)


def _render_header(
    log_date: date,
    total_miles: int,
    driver_name: str,
    co_driver: str,
    carrier_name: str,
    main_office: str,
    truck_number: str,
    trailer_number: str,
    bol_number: str,
) -> str:
    """Render the header band with all identification fields."""
    parts = []

    # Header background
    parts.append(f'<rect x="20" y="10" width="1160" height="85" '
                 f'fill="{COLOR_HEADER_BG}" stroke="{COLOR_GRID_LINE}" '
                 'stroke-width="0.5" rx="3"/>')

    # Title
    parts.append('<text x="600" y="30" text-anchor="middle" '
                 'font-size="14" font-weight="bold">DRIVER\'S DAILY LOG</text>')
    parts.append('<text x="600" y="44" text-anchor="middle" '
                 'font-size="9" fill="#666">'
                 '(24-Hour Period — Property-Carrying CMV)</text>')

    # Date
    date_str = log_date.strftime("%m/%d/%Y")
    parts.append(f'<text x="40" y="64" font-size="9" fill="#666">Date:</text>')
    parts.append(f'<text x="70" y="64" font-size="11" font-weight="bold">'
                 f'{date_str}</text>')

    # Total miles
    parts.append(f'<text x="180" y="64" font-size="9" fill="#666">'
                 'Total Miles Today:</text>')
    parts.append(f'<text x="275" y="64" font-size="11" font-weight="bold">'
                 f'{total_miles}</text>')

    # Truck/Trailer
    parts.append(f'<text x="360" y="64" font-size="9" fill="#666">'
                 'Truck/Tractor No.:</text>')
    parts.append(f'<text x="455" y="64" font-size="11">'
                 f'{_escape_xml(truck_number)}</text>')

    parts.append(f'<text x="560" y="64" font-size="9" fill="#666">'
                 'Trailer No.:</text>')
    parts.append(f'<text x="625" y="64" font-size="11">'
                 f'{_escape_xml(trailer_number)}</text>')

    # BOL
    parts.append(f'<text x="740" y="64" font-size="9" fill="#666">'
                 'B/L or Manifest No.:</text>')
    parts.append(f'<text x="850" y="64" font-size="11">'
                 f'{_escape_xml(bol_number)}</text>')

    # Driver / Carrier line
    parts.append(f'<text x="40" y="84" font-size="9" fill="#666">'
                 'Driver:</text>')
    parts.append(f'<text x="78" y="84" font-size="11">'
                 f'{_escape_xml(driver_name)}</text>')

    parts.append(f'<text x="320" y="84" font-size="9" fill="#666">'
                 'Co-Driver:</text>')
    parts.append(f'<text x="375" y="84" font-size="11">'
                 f'{_escape_xml(co_driver)}</text>')

    parts.append(f'<text x="540" y="84" font-size="9" fill="#666">'
                 'Carrier:</text>')
    parts.append(f'<text x="580" y="84" font-size="11">'
                 f'{_escape_xml(carrier_name)}</text>')

    parts.append(f'<text x="800" y="84" font-size="9" fill="#666">'
                 'Main Office:</text>')
    parts.append(f'<text x="862" y="84" font-size="11">'
                 f'{_escape_xml(main_office[:40])}</text>')

    return "\n".join(parts)


def _render_grid() -> str:
    """Render the 24-hour grid with row labels, time markers, and tick marks."""
    parts = []

    # Grid outer border
    parts.append(f'<rect x="{GRID_X}" y="{GRID_TOP}" '
                 f'width="{GRID_W}" height="{ROW_H * 4}" '
                 f'fill="none" stroke="{COLOR_GRID_LINE}" stroke-width="1.5"/>')

    # Alternating row backgrounds
    for i in range(4):
        if i % 2 == 1:
            parts.append(f'<rect x="{GRID_X}" y="{GRID_TOP + i * ROW_H}" '
                         f'width="{GRID_W}" height="{ROW_H}" '
                         f'fill="{COLOR_ROW_ALT}" opacity="0.5"/>')

    # Row separator lines
    for i in range(1, 4):
        y = GRID_TOP + i * ROW_H
        parts.append(f'<line x1="{GRID_X}" y1="{y}" '
                     f'x2="{GRID_RIGHT}" y2="{y}" '
                     f'stroke="{COLOR_GRID_LINE}" stroke-width="0.75"/>')

    # Row labels (left side)
    parts.append('<text x="30" y="103" font-size="10" font-weight="bold">'
                 'DUTY STATUS</text>')
    for i, label in enumerate(ROW_LABELS):
        y = GRID_TOP + i * ROW_H + ROW_H // 2 + 4
        parts.append(f'<text x="30" y="{y}" font-size="10">{label}</text>')

    # Time scale header
    # Hour marks and labels
    for h in range(25):
        x = _time_to_x(h)

        # Vertical hour lines (full height of grid)
        if h > 0 and h < 24:
            parts.append(f'<line x1="{x}" y1="{GRID_TOP}" '
                         f'x2="{x}" y2="{GRID_BOTTOM}" '
                         f'stroke="{COLOR_GRID_LIGHT}" stroke-width="0.5"/>')

        # Hour labels
        if h == 0:
            label = "Mid-"
            parts.append(f'<text x="{x}" y="{TIME_HEADER_Y}" '
                         'text-anchor="middle" font-size="8" '
                         f'font-weight="bold">{label}</text>')
            parts.append(f'<text x="{x}" y="{TIME_HEADER_Y + 9}" '
                         'text-anchor="middle" font-size="8" '
                         'font-weight="bold">night</text>')
        elif h == 12:
            parts.append(f'<text x="{x}" y="{TIME_HEADER_Y}" '
                         'text-anchor="middle" font-size="9" '
                         'font-weight="bold">Noon</text>')
        elif h == 24:
            label = "Mid-"
            parts.append(f'<text x="{x}" y="{TIME_HEADER_Y}" '
                         'text-anchor="middle" font-size="8" '
                         f'font-weight="bold">{label}</text>')
            parts.append(f'<text x="{x}" y="{TIME_HEADER_Y + 9}" '
                         'text-anchor="middle" font-size="8" '
                         'font-weight="bold">night</text>')
        else:
            display_h = h if h <= 12 else h - 12
            parts.append(f'<text x="{x}" y="{TIME_HEADER_Y}" '
                         f'text-anchor="middle" font-size="9">{display_h}</text>')

    # 15-minute tick marks (quarter-hour marks within each hour)
    for h in range(24):
        for q in range(1, 4):  # 15, 30, 45 min ticks
            x = _time_to_x(h + q / 4)
            tick_len = 6 if q == 2 else 4  # half-hour tick is longer
            for row in range(4):
                row_top = GRID_TOP + row * ROW_H
                # Top tick
                parts.append(f'<line x1="{x}" y1="{row_top}" '
                             f'x2="{x}" y2="{row_top + tick_len}" '
                             f'stroke="{COLOR_TICK}" stroke-width="0.5"/>')
                # Bottom tick
                parts.append(f'<line x1="{x}" y1="{row_top + ROW_H - tick_len}" '
                             f'x2="{x}" y2="{row_top + ROW_H}" '
                             f'stroke="{COLOR_TICK}" stroke-width="0.5"/>')

    # Strong vertical lines at midnight and noon
    for h in [0, 12, 24]:
        x = _time_to_x(h)
        parts.append(f'<line x1="{x}" y1="{GRID_TOP}" '
                     f'x2="{x}" y2="{GRID_BOTTOM}" '
                     f'stroke="{COLOR_GRID_LINE}" stroke-width="1.5"/>')

    # Totals column header
    parts.append(f'<text x="{TOTALS_X + 15}" y="{TIME_HEADER_Y}" '
                 'text-anchor="middle" font-size="9" font-weight="bold">'
                 'Total</text>')
    parts.append(f'<text x="{TOTALS_X + 15}" y="{TIME_HEADER_Y + 10}" '
                 'text-anchor="middle" font-size="8">Hours</text>')

    return "\n".join(parts)


def _render_duty_line(duty_events: list[dict], log_date: date, tz: ZoneInfo) -> str:
    """
    Render the duty status line — horizontal segments at each status row
    with vertical connectors between status changes.
    """
    if not duty_events:
        return ""

    parts = []
    parts.append(f'<g stroke="{COLOR_DUTY_LINE}" stroke-width="2.5" '
                 'stroke-linecap="round" fill="none">')

    segments = []  # list of (start_hour, end_hour, status)
    midnight_start = datetime.combine(log_date, time.min, tzinfo=tz)
    midnight_end = midnight_start + timedelta(days=1)

    for event in duty_events:
        start_dt = event["start_time"]
        end_dt = event["end_time"]
        status = event["status"]

        if isinstance(start_dt, str):
            start_dt = datetime.fromisoformat(start_dt)
        if isinstance(end_dt, str):
            end_dt = datetime.fromisoformat(end_dt)

        start_local = start_dt.astimezone(tz)
        end_local = end_dt.astimezone(tz)

        # Clip to this day
        if end_local <= midnight_start or start_local >= midnight_end:
            continue

        seg_start = max(start_local, midnight_start)
        seg_end = min(end_local, midnight_end)

        start_hour = (seg_start - midnight_start).total_seconds() / 3600
        end_hour = (seg_end - midnight_start).total_seconds() / 3600

        if end_hour > start_hour:
            segments.append((start_hour, end_hour, status))

    if not segments:
        # Default: full day off duty
        x1 = _time_to_x(0)
        x2 = _time_to_x(24)
        y = _status_to_y("off_duty")
        parts.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}"/>')
        parts.append("</g>")
        return "\n".join(parts)

    # Fill gaps: if first segment doesn't start at 0, draw off_duty from 0
    if segments[0][0] > 0.01:
        segments.insert(0, (0, segments[0][0], "off_duty"))
    # If last segment doesn't end at 24, draw off_duty to 24
    if segments[-1][1] < 23.99:
        segments.append((segments[-1][1], 24, "off_duty"))

    # Draw horizontal segments and vertical connectors
    prev_status = None
    for start_h, end_h, status in segments:
        x1 = _time_to_x(start_h)
        x2 = _time_to_x(end_h)
        y = _status_to_y(status)

        # Vertical connector from previous status
        if prev_status is not None and prev_status != status:
            prev_y = _status_to_y(prev_status)
            parts.append(f'<line x1="{x1}" y1="{prev_y}" x2="{x1}" y2="{y}"/>')

        # Horizontal segment
        parts.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}"/>')
        prev_status = status

    parts.append("</g>")
    return "\n".join(parts)


def _render_totals(
    off_duty: float,
    sleeper_berth: float,
    driving: float,
    on_duty_nd: float,
) -> str:
    """Render the totals column on the right side of the grid."""
    parts = []

    totals = [float(off_duty), float(sleeper_berth), float(driving), float(on_duty_nd)]
    grand_total = sum(totals)

    # Totals column border
    parts.append(f'<rect x="{TOTALS_X}" y="{GRID_TOP}" width="60" '
                 f'height="{ROW_H * 4}" fill="none" '
                 f'stroke="{COLOR_GRID_LINE}" stroke-width="1"/>')

    # Individual row totals
    for i, total in enumerate(totals):
        y = GRID_TOP + i * ROW_H + ROW_H // 2 + 5
        parts.append(f'<text x="{TOTALS_X + 30}" y="{y}" text-anchor="middle" '
                     f'font-size="12" font-weight="bold">{total:.2f}</text>')
        # Row separator in totals column
        if i < 3:
            sep_y = GRID_TOP + (i + 1) * ROW_H
            parts.append(f'<line x1="{TOTALS_X}" y1="{sep_y}" '
                         f'x2="{TOTALS_X + 60}" y2="{sep_y}" '
                         f'stroke="{COLOR_GRID_LINE}" stroke-width="0.5"/>')

    # Grand total below
    parts.append(f'<line x1="{TOTALS_X}" y1="{GRID_BOTTOM}" '
                 f'x2="{TOTALS_X + 60}" y2="{GRID_BOTTOM}" '
                 f'stroke="{COLOR_GRID_LINE}" stroke-width="1.5"/>')
    parts.append(f'<text x="{TOTALS_X + 30}" y="{GRID_BOTTOM + 16}" '
                 'text-anchor="middle" font-size="11" font-weight="bold">'
                 f'= {grand_total:.2f}</text>')

    return "\n".join(parts)


def _render_remarks(duty_events: list[dict], log_date: date, tz: ZoneInfo) -> str:
    """Render the remarks section showing location at each duty status change."""
    parts = []

    midnight_start = datetime.combine(log_date, time.min, tzinfo=tz)
    midnight_end = midnight_start + timedelta(days=1)

    # Section border and header
    parts.append(f'<rect x="30" y="{REMARKS_Y}" width="1140" height="{REMARKS_H}" '
                 f'fill="none" stroke="{COLOR_GRID_LINE}" stroke-width="0.5"/>')
    parts.append(f'<text x="40" y="{REMARKS_Y + 15}" font-size="10" '
                 'font-weight="bold">REMARKS (Record City, State and Time of Each Change)</text>')

    # Collect changes for this day
    changes = []
    for event in duty_events:
        start_dt = event["start_time"]
        if isinstance(start_dt, str):
            start_dt = datetime.fromisoformat(start_dt)

        start_local = start_dt.astimezone(tz)
        if midnight_start <= start_local < midnight_end:
            time_str = start_local.strftime("%H:%M")
            location = event.get("location_label", "")
            remark = event.get("remark", "")
            status = event.get("status", "")
            changes.append((time_str, location, remark, status))

    # Render change entries (max 8 per log to fit)
    line_y = REMARKS_Y + 32
    max_entries = min(len(changes), 8)
    for i in range(max_entries):
        time_str, location, remark, status = changes[i]
        # Truncate location for display
        loc_short = location[:50] if len(location) > 50 else location
        text = f"{time_str} — {_escape_xml(loc_short)}"
        if remark:
            text += f" ({_escape_xml(remark[:30])})"

        parts.append(f'<text x="50" y="{line_y}" font-size="9">{text}</text>')
        line_y += 14

    if len(changes) > max_entries:
        parts.append(f'<text x="50" y="{line_y}" font-size="9" fill="#666">'
                     f'... and {len(changes) - max_entries} more entries</text>')

    return "\n".join(parts)


def _render_recap(
    cycle_hours_today: float,
    cycle_hours_7day: float,
    driving_hours: float,
    on_duty_nd_hours: float,
) -> str:
    """Render the 70-hour/8-day recap section."""
    parts = []

    on_duty_today = float(driving_hours) + float(on_duty_nd_hours)
    total_on_duty = float(cycle_hours_7day) + on_duty_today
    hours_available = max(0, 70 - total_on_duty)

    # Section border
    parts.append(f'<rect x="30" y="{RECAP_Y}" width="1140" height="90" '
                 f'fill="none" stroke="{COLOR_GRID_LINE}" stroke-width="0.5"/>')

    # Header
    parts.append(f'<text x="40" y="{RECAP_Y + 16}" font-size="10" '
                 'font-weight="bold">RECAP — 70-Hour / 8-Day Rule</text>')

    # Recap data
    col_x = [60, 300, 540, 780]
    data_y = RECAP_Y + 40

    labels = [
        "On-Duty Hours Today:",
        "Total (Cycle):",
        "Hours Available:",
        "70-Hr Limit:",
    ]
    values = [
        f"{on_duty_today:.2f}",
        f"{total_on_duty:.2f}",
        f"{hours_available:.2f}",
        "70.00",
    ]

    for i in range(4):
        parts.append(f'<text x="{col_x[i]}" y="{data_y}" font-size="9" '
                     f'fill="#666">{labels[i]}</text>')
        parts.append(f'<text x="{col_x[i]}" y="{data_y + 16}" font-size="12" '
                     f'font-weight="bold">{values[i]}</text>')

    # 8-day breakdown hint
    parts.append(f'<text x="60" y="{data_y + 45}" font-size="9" fill="#666">'
                 'Cumulative on-duty hours for the preceding 7 days + today '
                 'must not exceed 70 hours (Property-carrying CMV, 8-day cycle).'
                 '</text>')

    return "\n".join(parts)


def _render_certification(driver_name: str) -> str:
    """Render the certification/signature section."""
    parts = []
    y = RECAP_Y + 105

    parts.append(f'<rect x="30" y="{y}" width="1140" height="50" '
                 f'fill="none" stroke="{COLOR_GRID_LINE}" stroke-width="0.5"/>')

    parts.append(f'<text x="40" y="{y + 18}" font-size="9">'
                 'I hereby certify that the entries on this record are true and correct '
                 'to the best of my knowledge.</text>')

    parts.append(f'<text x="40" y="{y + 38}" font-size="9" fill="#666">'
                 'Driver\'s Signature:</text>')
    parts.append(f'<text x="140" y="{y + 38}" font-size="11" '
                 f'font-style="italic">{_escape_xml(driver_name)}</text>')

    # Date signed
    parts.append(f'<text x="500" y="{y + 38}" font-size="9" fill="#666">'
                 'Date:</text>')
    parts.append(f'<text x="530" y="{y + 38}" font-size="11">'
                 '______________</text>')

    # DVIRs reference
    parts.append(f'<text x="700" y="{y + 38}" font-size="9" fill="#666">'
                 'Vehicle Condition Satisfactory: Yes</text>')

    return "\n".join(parts)


def render_log_for_trip(daily_log, duty_events_qs, trip, co_driver: str = "", home_tz: str = "America/Chicago") -> str:
    """
    Convenience wrapper: renders SVG for a DailyLog model instance.

    Args:
        daily_log: DailyLog model instance
        duty_events_qs: QuerySet or list of DutyStatusEvent for this trip
        trip: Trip model instance
        co_driver: Co-driver name (optional override)
    """
    from zoneinfo import ZoneInfo

    tz = ZoneInfo(home_tz)
    log_date = daily_log.log_date

    # Filter duty events that overlap this day
    midnight_start = datetime.combine(log_date, time.min, tzinfo=tz)
    midnight_end = midnight_start + timedelta(days=1)

    events_for_day = []
    for event in duty_events_qs:
        start_dt = event.start_time if hasattr(event, "start_time") else event["start_time"]
        end_dt = event.end_time if hasattr(event, "end_time") else event["end_time"]

        if isinstance(start_dt, str):
            start_dt = datetime.fromisoformat(start_dt)
        if isinstance(end_dt, str):
            end_dt = datetime.fromisoformat(end_dt)

        # Include if any overlap with this day
        if end_dt > midnight_start and start_dt < midnight_end:
            events_for_day.append({
                "start_time": start_dt,
                "end_time": end_dt,
                "status": event.status if hasattr(event, "status") else event["status"],
                "location_label": (
                    event.location_label if hasattr(event, "location_label")
                    else event.get("location_label", "")
                ),
                "remark": (
                    event.remark if hasattr(event, "remark")
                    else event.get("remark", "")
                ),
            })

    # Get driver/carrier info from trip
    driver_name = ""
    carrier_name = ""
    main_office = ""
    truck_number = ""
    trailer_number = ""

    if trip.driver:
        driver_name = trip.driver.name
        carrier_name = trip.driver.carrier_name
        main_office = trip.driver.carrier_main_office

    if trip.vehicle:
        truck_number = trip.vehicle.truck_number
        trailer_number = trip.vehicle.trailer_number

    # Calculate cycle data
    on_duty_today = float(daily_log.total_driving) + float(daily_log.total_on_duty_not_driving)

    return render_daily_log_svg(
        log_date=log_date,
        duty_events=events_for_day,
        total_miles=int(daily_log.total_miles_driving_today),
        total_off_duty=float(daily_log.total_off_duty),
        total_sleeper_berth=float(daily_log.total_sleeper_berth),
        total_driving=float(daily_log.total_driving),
        total_on_duty_nd=float(daily_log.total_on_duty_not_driving),
        driver_name=driver_name,
        co_driver=co_driver,
        carrier_name=carrier_name,
        main_office=main_office,
        truck_number=truck_number,
        trailer_number=trailer_number,
        bol_number=daily_log.shipping_doc_number or trip.bol_number,
        home_tz=home_tz,
        cycle_hours_today=on_duty_today,
        cycle_hours_7day=trip.current_cycle_used_hours,
    )
