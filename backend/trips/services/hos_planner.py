"""
HOS (Hours of Service) trip planner engine.

Implements FMCSA property-carrying CMV driver rules:
- 11-hour driving limit per shift
- 14-hour driving window
- 30-minute break after 8 hours cumulative driving
- 10 consecutive hours off duty to reset shift clocks
- 70-hour / 8-day on-duty cap
- 34-hour restart to reset the 70-hour cycle
- 1-hour on-duty for pickup and drop-off
- Fuel stop every 1,000 miles (15 min)
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

DRIVING_LIMIT_MIN = 11 * 60       # 660
WINDOW_LIMIT_MIN = 14 * 60        # 840
BREAK_THRESHOLD_MIN = 8 * 60      # 480
BREAK_DURATION_MIN = 30
REST_DURATION_MIN = 10 * 60       # 600
CYCLE_LIMIT_MIN = 70 * 60         # 4200
RESTART_DURATION_MIN = 34 * 60    # 2040
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_MIN = 15
PICKUP_DURATION_MIN = 60
DROPOFF_DURATION_MIN = 60
PRE_TRIP_DURATION_MIN = 15


@dataclass
class StopRecord:
    sequence: int
    stop_type: str
    label: str
    lat: float
    lng: float
    arrival_time: datetime
    departure_time: datetime
    duration_minutes: int
    cumulative_miles: float
    notes: str = ""


@dataclass
class DutyEventRecord:
    start_time: datetime
    end_time: datetime
    status: str  # off_duty, sleeper_berth, driving, on_duty_not_driving
    location_label: str
    lat: float
    lng: float
    remark: str = ""


@dataclass
class DailyLogRecord:
    log_date: str  # YYYY-MM-DD
    total_miles_driving_today: float
    total_off_duty: float  # decimal hours
    total_sleeper_berth: float
    total_driving: float
    total_on_duty_not_driving: float
    shipping_doc_number: str = ""


@dataclass
class PlanResult:
    stops: list[StopRecord] = field(default_factory=list)
    duty_events: list[DutyEventRecord] = field(default_factory=list)
    daily_logs: list[DailyLogRecord] = field(default_factory=list)
    total_driving_minutes: int = 0
    total_trip_minutes: int = 0


class TripClock:
    """Tracks all HOS clocks for a driver during trip planning."""

    def __init__(self, cycle_used_hours: float, start_time: datetime):
        self.shift_driving = 0  # minutes of driving this shift
        self.shift_window = 0   # minutes since coming on duty this shift
        self.driving_since_break = 0  # cumulative driving since last 30-min break
        self.cycle_used = int(cycle_used_hours * 60)  # total on-duty in cycle (minutes)
        self.current_time = start_time
        self.cumulative_miles = 0.0
        self.miles_since_fuel = 0.0

    def needs_34hr_restart(self) -> bool:
        return self.cycle_used >= CYCLE_LIMIT_MIN

    def needs_10hr_rest(self) -> bool:
        return (
            self.shift_driving >= DRIVING_LIMIT_MIN
            or self.shift_window >= WINDOW_LIMIT_MIN
        )

    def needs_30min_break(self) -> bool:
        return self.driving_since_break >= BREAK_THRESHOLD_MIN

    def needs_fuel(self) -> bool:
        return self.miles_since_fuel >= FUEL_INTERVAL_MILES

    def can_drive_minutes(self) -> int:
        """Max minutes the driver can drive before hitting any limit."""
        remaining = []
        remaining.append(DRIVING_LIMIT_MIN - self.shift_driving)
        remaining.append(WINDOW_LIMIT_MIN - self.shift_window)
        remaining.append(BREAK_THRESHOLD_MIN - self.driving_since_break)
        cycle_remaining = CYCLE_LIMIT_MIN - self.cycle_used
        remaining.append(cycle_remaining)
        return max(0, min(remaining))

    def advance_driving(self, minutes: int, miles: float):
        self.shift_driving += minutes
        self.shift_window += minutes
        self.driving_since_break += minutes
        self.cycle_used += minutes
        self.current_time += timedelta(minutes=minutes)
        self.cumulative_miles += miles
        self.miles_since_fuel += miles

    def advance_on_duty(self, minutes: int):
        self.shift_window += minutes
        self.cycle_used += minutes
        self.current_time += timedelta(minutes=minutes)

    def advance_off_duty(self, minutes: int):
        self.current_time += timedelta(minutes=minutes)

    def reset_shift(self):
        """After 10-hr rest: reset driving and window clocks."""
        self.shift_driving = 0
        self.shift_window = 0
        self.driving_since_break = 0

    def reset_cycle(self):
        """After 34-hr restart: reset everything."""
        self.shift_driving = 0
        self.shift_window = 0
        self.driving_since_break = 0
        self.cycle_used = 0


def _interpolate_position(
    polyline: list[tuple[float, float]],
    target_miles: float,
    total_miles: float,
) -> tuple[float, float]:
    """Estimate lat/lng at a given mileage along a polyline."""
    if total_miles <= 0 or not polyline:
        return polyline[0] if polyline else (0.0, 0.0)

    fraction = min(target_miles / total_miles, 1.0)
    idx = int(fraction * (len(polyline) - 1))
    idx = max(0, min(idx, len(polyline) - 1))
    return polyline[idx]


def _reverse_geocode_label(lat: float, lng: float) -> str:
    """Simple label from coordinates (used for rest/break locations)."""
    lat_dir = "N" if lat >= 0 else "S"
    lng_dir = "W" if lng < 0 else "E"
    return f"{abs(lat):.2f}°{lat_dir}, {abs(lng):.2f}°{lng_dir}"


def plan_trip(
    legs: list,
    origin_address: str,
    origin_lat: float,
    origin_lng: float,
    pickup_address: str,
    pickup_lat: float,
    pickup_lng: float,
    dropoff_address: str,
    dropoff_lat: float,
    dropoff_lng: float,
    total_distance_miles: float,
    polyline_points: list[tuple[float, float]],
    cycle_used_hours: float,
    start_time: datetime,
    home_tz: str = "America/Chicago",
    bol_number: str = "",
) -> PlanResult:
    """
    Plan the full trip with HOS compliance.

    Args:
        legs: list of LegResult from routing service (leg 0 = origin→pickup, leg 1 = pickup→dropoff)
        origin_address, origin_lat, origin_lng: starting point
        pickup_address, pickup_lat, pickup_lng: pickup location
        dropoff_address, dropoff_lat, dropoff_lng: dropoff location
        total_distance_miles: total route distance
        polyline_points: full route polyline as list of (lat, lng)
        cycle_used_hours: hours already used in 70-hr cycle
        start_time: trip start datetime (tz-aware)
        home_tz: IANA timezone for the driver's home terminal
        bol_number: shipping document number

    Returns: PlanResult with stops, duty_events, and daily_logs
    """
    clock = TripClock(cycle_used_hours=cycle_used_hours, start_time=start_time)
    result = PlanResult()
    seq = 0

    # --- Origin stop + pre-trip inspection ---
    seq += 1
    origin_arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=PRE_TRIP_DURATION_MIN),
        status="on_duty_not_driving",
        location_label=origin_address,
        lat=origin_lat,
        lng=origin_lng,
        remark="Pre-trip inspection",
    ))
    clock.advance_on_duty(PRE_TRIP_DURATION_MIN)
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="origin",
        label=origin_address,
        lat=origin_lat,
        lng=origin_lng,
        arrival_time=origin_arrival,
        departure_time=clock.current_time,
        duration_minutes=PRE_TRIP_DURATION_MIN,
        cumulative_miles=0,
        notes="Pre-trip inspection",
    ))

    # --- Leg 1: Origin → Pickup ---
    leg1 = legs[0] if legs else None
    if leg1 and leg1.distance_miles > 0.5:
        _drive_leg(
            result, clock, seq,
            leg1.distance_miles, leg1.duration_minutes,
            leg1.polyline_points,
            origin_address, origin_lat, origin_lng,
            pickup_address, pickup_lat, pickup_lng,
        )
        seq = len(result.stops)

    # --- Pickup stop (1 hr on-duty) ---
    seq += 1
    pickup_arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=PICKUP_DURATION_MIN),
        status="on_duty_not_driving",
        location_label=pickup_address,
        lat=pickup_lat,
        lng=pickup_lng,
        remark="Pickup",
    ))
    clock.advance_on_duty(PICKUP_DURATION_MIN)
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="pickup",
        label=pickup_address,
        lat=pickup_lat,
        lng=pickup_lng,
        arrival_time=pickup_arrival,
        departure_time=clock.current_time,
        duration_minutes=PICKUP_DURATION_MIN,
        cumulative_miles=clock.cumulative_miles,
        notes="Pickup - loading",
    ))

    # --- Leg 2: Pickup → Dropoff ---
    leg2 = legs[1] if len(legs) > 1 else None
    if leg2 and leg2.distance_miles > 0.5:
        _drive_leg(
            result, clock, seq,
            leg2.distance_miles, leg2.duration_minutes,
            leg2.polyline_points,
            pickup_address, pickup_lat, pickup_lng,
            dropoff_address, dropoff_lat, dropoff_lng,
        )
        seq = len(result.stops)

    # --- Dropoff stop (1 hr on-duty) ---
    seq += 1
    dropoff_arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=DROPOFF_DURATION_MIN),
        status="on_duty_not_driving",
        location_label=dropoff_address,
        lat=dropoff_lat,
        lng=dropoff_lng,
        remark="Drop-off",
    ))
    clock.advance_on_duty(DROPOFF_DURATION_MIN)
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="dropoff",
        label=dropoff_address,
        lat=dropoff_lat,
        lng=dropoff_lng,
        arrival_time=dropoff_arrival,
        departure_time=clock.current_time,
        duration_minutes=DROPOFF_DURATION_MIN,
        cumulative_miles=clock.cumulative_miles,
        notes="Drop-off - unloading",
    ))

    # --- Post-trip: go off duty ---
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=15),
        status="off_duty",
        location_label=dropoff_address,
        lat=dropoff_lat,
        lng=dropoff_lng,
        remark="Post-trip / Off duty",
    ))

    # Calculate totals
    result.total_driving_minutes = sum(
        int((e.end_time - e.start_time).total_seconds() / 60)
        for e in result.duty_events if e.status == "driving"
    )
    result.total_trip_minutes = int(
        (clock.current_time - start_time).total_seconds() / 60
    )

    # Generate daily logs
    result.daily_logs = generate_daily_logs(
        result.duty_events, home_tz, bol_number,
        total_distance_miles=total_distance_miles,
    )

    return result


def _drive_leg(
    result: PlanResult,
    clock: TripClock,
    seq_start: int,
    leg_distance_miles: float,
    leg_duration_minutes: float,
    leg_polyline: list[tuple[float, float]],
    start_address: str,
    start_lat: float,
    start_lng: float,
    end_address: str,
    end_lat: float,
    end_lng: float,
):
    """Drive a leg of the trip, inserting breaks/rests/fuel as needed."""
    if leg_duration_minutes <= 0:
        return

    avg_speed_mph = leg_distance_miles / (leg_duration_minutes / 60) if leg_duration_minutes > 0 else 60
    miles_remaining = leg_distance_miles
    leg_miles_driven = 0.0

    while miles_remaining > 0.5:
        # Check HOS limits before driving
        if clock.needs_34hr_restart():
            _insert_restart(result, clock, leg_polyline, leg_miles_driven, leg_distance_miles)

        if clock.needs_10hr_rest():
            _insert_rest(result, clock, leg_polyline, leg_miles_driven, leg_distance_miles)

        if clock.needs_30min_break():
            _insert_break(result, clock, leg_polyline, leg_miles_driven, leg_distance_miles)

        if clock.needs_fuel():
            _insert_fuel(result, clock, leg_polyline, leg_miles_driven, leg_distance_miles)

        # How much can we drive in one chunk?
        drivable_minutes = clock.can_drive_minutes()
        if drivable_minutes <= 0:
            # Safety: if somehow stuck, force a rest
            _insert_rest(result, clock, leg_polyline, leg_miles_driven, leg_distance_miles)
            continue

        # How far does that take us?
        drivable_miles = (drivable_minutes / 60) * avg_speed_mph

        # Also limit by fuel interval
        fuel_miles_left = FUEL_INTERVAL_MILES - clock.miles_since_fuel
        if fuel_miles_left > 0:
            drivable_miles = min(drivable_miles, fuel_miles_left)

        # Don't overshoot the leg
        drive_miles = min(drivable_miles, miles_remaining)
        drive_minutes = (drive_miles / avg_speed_mph) * 60 if avg_speed_mph > 0 else 0
        drive_minutes = max(1, int(round(drive_minutes)))
        drive_miles = max(0.1, drive_miles)

        # Determine location for this driving segment
        segment_start_miles = leg_miles_driven
        segment_end_miles = leg_miles_driven + drive_miles
        start_pos = _interpolate_position(leg_polyline, segment_start_miles, leg_distance_miles)
        end_pos = _interpolate_position(leg_polyline, segment_end_miles, leg_distance_miles)

        start_label = start_address if segment_start_miles < 1 else _reverse_geocode_label(*start_pos)
        end_label = end_address if miles_remaining - drive_miles < 1 else _reverse_geocode_label(*end_pos)

        result.duty_events.append(DutyEventRecord(
            start_time=clock.current_time,
            end_time=clock.current_time + timedelta(minutes=drive_minutes),
            status="driving",
            location_label=start_label,
            lat=start_pos[0],
            lng=start_pos[1],
            remark=f"Driving toward {end_label}",
        ))

        clock.advance_driving(drive_minutes, drive_miles)
        leg_miles_driven += drive_miles
        miles_remaining -= drive_miles


def _insert_break(
    result: PlanResult,
    clock: TripClock,
    polyline: list[tuple[float, float]],
    current_leg_miles: float,
    total_leg_miles: float,
):
    """Insert a 30-minute break."""
    pos = _interpolate_position(polyline, current_leg_miles, total_leg_miles)
    label = _reverse_geocode_label(*pos)

    seq = len(result.stops) + 1
    arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=BREAK_DURATION_MIN),
        status="off_duty",
        location_label=label,
        lat=pos[0],
        lng=pos[1],
        remark="30-minute break (8-hr driving rule)",
    ))
    clock.advance_off_duty(BREAK_DURATION_MIN)
    clock.shift_window += BREAK_DURATION_MIN  # break counts against 14-hr window
    clock.driving_since_break = 0
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="break_30min",
        label=label,
        lat=pos[0],
        lng=pos[1],
        arrival_time=arrival,
        departure_time=clock.current_time,
        duration_minutes=BREAK_DURATION_MIN,
        cumulative_miles=clock.cumulative_miles,
        notes="30-minute break",
    ))


def _insert_rest(
    result: PlanResult,
    clock: TripClock,
    polyline: list[tuple[float, float]],
    current_leg_miles: float,
    total_leg_miles: float,
):
    """Insert a 10-hour rest period (sleeper berth)."""
    pos = _interpolate_position(polyline, current_leg_miles, total_leg_miles)
    label = _reverse_geocode_label(*pos)

    seq = len(result.stops) + 1
    arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=REST_DURATION_MIN),
        status="sleeper_berth",
        location_label=label,
        lat=pos[0],
        lng=pos[1],
        remark="10-hour rest (sleeper berth)",
    ))
    clock.advance_off_duty(REST_DURATION_MIN)
    clock.reset_shift()
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="rest_10hr",
        label=label,
        lat=pos[0],
        lng=pos[1],
        arrival_time=arrival,
        departure_time=clock.current_time,
        duration_minutes=REST_DURATION_MIN,
        cumulative_miles=clock.cumulative_miles,
        notes="10-hour rest period",
    ))


def _insert_restart(
    result: PlanResult,
    clock: TripClock,
    polyline: list[tuple[float, float]],
    current_leg_miles: float,
    total_leg_miles: float,
):
    """Insert a 34-hour restart."""
    pos = _interpolate_position(polyline, current_leg_miles, total_leg_miles)
    label = _reverse_geocode_label(*pos)

    seq = len(result.stops) + 1
    arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=RESTART_DURATION_MIN),
        status="sleeper_berth",
        location_label=label,
        lat=pos[0],
        lng=pos[1],
        remark="34-hour restart (70-hr cycle reset)",
    ))
    clock.advance_off_duty(RESTART_DURATION_MIN)
    clock.reset_cycle()
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="restart_34hr",
        label=label,
        lat=pos[0],
        lng=pos[1],
        arrival_time=arrival,
        departure_time=clock.current_time,
        duration_minutes=RESTART_DURATION_MIN,
        cumulative_miles=clock.cumulative_miles,
        notes="34-hour restart",
    ))


def _insert_fuel(
    result: PlanResult,
    clock: TripClock,
    polyline: list[tuple[float, float]],
    current_leg_miles: float,
    total_leg_miles: float,
):
    """Insert a fuel stop (15 min on-duty)."""
    pos = _interpolate_position(polyline, current_leg_miles, total_leg_miles)
    label = _reverse_geocode_label(*pos)

    seq = len(result.stops) + 1
    arrival = clock.current_time
    result.duty_events.append(DutyEventRecord(
        start_time=clock.current_time,
        end_time=clock.current_time + timedelta(minutes=FUEL_STOP_DURATION_MIN),
        status="on_duty_not_driving",
        location_label=label,
        lat=pos[0],
        lng=pos[1],
        remark="Fueling",
    ))
    clock.advance_on_duty(FUEL_STOP_DURATION_MIN)
    clock.miles_since_fuel = 0
    result.stops.append(StopRecord(
        sequence=seq,
        stop_type="fuel",
        label=label,
        lat=pos[0],
        lng=pos[1],
        arrival_time=arrival,
        departure_time=clock.current_time,
        duration_minutes=FUEL_STOP_DURATION_MIN,
        cumulative_miles=clock.cumulative_miles,
        notes="Fuel stop",
    ))


def generate_daily_logs(
    duty_events: list[DutyEventRecord],
    home_tz: str = "America/Chicago",
    bol_number: str = "",
    total_distance_miles: float = 0,
) -> list[DailyLogRecord]:
    """
    Generate daily log records from duty events.

    Splits events at midnight boundaries in the driver's home terminal timezone,
    then aggregates hours per status per day.
    """
    if not duty_events:
        return []

    tz = ZoneInfo(home_tz)

    # Split events at midnight
    split_events: list[tuple[str, DutyEventRecord]] = []  # (date_str, event)

    for event in duty_events:
        start_local = event.start_time.astimezone(tz)
        end_local = event.end_time.astimezone(tz)

        current = start_local
        while current.date() < end_local.date():
            next_midnight = datetime.combine(
                current.date() + timedelta(days=1),
                datetime.min.time(),
                tzinfo=tz,
            )
            split_events.append((
                current.date().isoformat(),
                DutyEventRecord(
                    start_time=current.astimezone(event.start_time.tzinfo),
                    end_time=next_midnight.astimezone(event.start_time.tzinfo),
                    status=event.status,
                    location_label=event.location_label,
                    lat=event.lat,
                    lng=event.lng,
                    remark=event.remark,
                ),
            ))
            current = next_midnight

        if current < end_local:
            split_events.append((
                current.date().isoformat(),
                DutyEventRecord(
                    start_time=current.astimezone(event.start_time.tzinfo),
                    end_time=end_local.astimezone(event.start_time.tzinfo),
                    status=event.status,
                    location_label=event.location_label,
                    lat=event.lat,
                    lng=event.lng,
                    remark=event.remark,
                ),
            ))

    # Group by date and aggregate
    daily: dict[str, dict] = {}

    for date_str, event in split_events:
        if date_str not in daily:
            daily[date_str] = {
                "off_duty": 0.0,
                "sleeper_berth": 0.0,
                "driving": 0.0,
                "on_duty_not_driving": 0.0,
            }
        minutes = (event.end_time - event.start_time).total_seconds() / 60
        hours = minutes / 60

        if event.status == "off_duty":
            daily[date_str]["off_duty"] += hours
        elif event.status == "sleeper_berth":
            daily[date_str]["sleeper_berth"] += hours
        elif event.status == "driving":
            daily[date_str]["driving"] += hours
        elif event.status == "on_duty_not_driving":
            daily[date_str]["on_duty_not_driving"] += hours

    # Fill remaining hours to 24 as off-duty, then round while preserving sum
    logs = []
    total_driving_hrs = sum(d["driving"] for d in daily.values())

    for date_str in sorted(daily.keys()):
        d = daily[date_str]
        accounted = d["off_duty"] + d["sleeper_berth"] + d["driving"] + d["on_duty_not_driving"]
        if accounted < 24:
            d["off_duty"] += 24 - accounted

        # Round to nearest quarter hour, then adjust off_duty to keep sum at 24
        keys = ["sleeper_berth", "driving", "on_duty_not_driving"]
        for key in keys:
            d[key] = round(d[key] * 4) / 4
        d["off_duty"] = 24.0 - d["sleeper_berth"] - d["driving"] - d["on_duty_not_driving"]
        d["off_duty"] = round(d["off_duty"] * 4) / 4

        # Compute driving miles for this day proportionally from total trip distance
        if total_driving_hrs > 0:
            driving_miles = d["driving"] / total_driving_hrs * total_distance_miles
        else:
            driving_miles = 0

        logs.append(DailyLogRecord(
            log_date=date_str,
            total_miles_driving_today=round(driving_miles),
            total_off_duty=d["off_duty"],
            total_sleeper_berth=d["sleeper_berth"],
            total_driving=d["driving"],
            total_on_duty_not_driving=d["on_duty_not_driving"],
            shipping_doc_number=bol_number,
        ))

    return logs
