"""Comprehensive HOS planner test suite."""
import os, sys, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.dev'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from trips.services.hos_planner import (
    plan_trip, TripClock,
    DRIVING_LIMIT_MIN, WINDOW_LIMIT_MIN, BREAK_THRESHOLD_MIN,
    CYCLE_LIMIT_MIN, FUEL_INTERVAL_MILES
)

tz = ZoneInfo('America/Chicago')
results = []


class FakeLeg:
    def __init__(self, distance_miles, duration_minutes, polyline_points=None):
        self.distance_miles = distance_miles
        self.duration_minutes = duration_minutes
        self.polyline_points = polyline_points or [(40.0, -88.0), (41.0, -87.0)]


def run_test(name, legs, cycle_used, expected_checks):
    start = datetime(2026, 7, 22, 6, 0, tzinfo=tz)
    result = plan_trip(
        legs=legs,
        origin_address='Chicago, IL',
        origin_lat=41.8781, origin_lng=-87.6298,
        pickup_address='Indianapolis, IN',
        pickup_lat=39.7684, pickup_lng=-86.1581,
        dropoff_address='Columbus, OH',
        dropoff_lat=39.9612, dropoff_lng=-82.9988,
        total_distance_miles=sum(l.distance_miles for l in legs),
        polyline_points=[(41.0, -87.0), (40.0, -86.0), (39.9, -83.0)],
        cycle_used_hours=cycle_used,
        start_time=start,
        bol_number='TEST-001',
    )

    errors = []
    for check_name, check_fn in expected_checks.items():
        try:
            ok = check_fn(result)
            if not ok:
                errors.append(f'  FAIL: {check_name}')
        except Exception as e:
            errors.append(f'  ERROR: {check_name}: {e}')

    status = 'PASS' if not errors else 'FAIL'
    results.append((name, status, errors, result))
    return result


# ========= TEST 1: Short trip, no breaks needed =========
run_test(
    'Short trip (150mi, ~2.5h driving) - no HOS limits hit',
    [FakeLeg(80, 90), FakeLeg(70, 80)],
    cycle_used=10,
    expected_checks={
        'No breaks inserted': lambda r: not any(s.stop_type == 'break_30min' for s in r.stops),
        'No rests inserted': lambda r: not any(s.stop_type == 'rest_10hr' for s in r.stops),
        'No restarts inserted': lambda r: not any(s.stop_type == 'restart_34hr' for s in r.stops),
        'No fuel stops': lambda r: not any(s.stop_type == 'fuel' for s in r.stops),
        'Has origin': lambda r: any(s.stop_type == 'origin' for s in r.stops),
        'Has pickup (1hr)': lambda r: any(s.stop_type == 'pickup' and s.duration_minutes == 60 for s in r.stops),
        'Has dropoff (1hr)': lambda r: any(s.stop_type == 'dropoff' and s.duration_minutes == 60 for s in r.stops),
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
    }
)

# ========= TEST 2: Trip triggers 30-min break (>8 hrs driving) =========
run_test(
    '500mi trip (~8.3h driving) - should trigger 30-min break',
    [FakeLeg(200, 200), FakeLeg(300, 300)],
    cycle_used=0,
    expected_checks={
        '30-min break inserted': lambda r: any(s.stop_type == 'break_30min' for s in r.stops),
        'Break is 30 min': lambda r: all(s.duration_minutes == 30 for s in r.stops if s.stop_type == 'break_30min'),
        'Pickup present': lambda r: any(s.stop_type == 'pickup' for s in r.stops),
        'Dropoff present': lambda r: any(s.stop_type == 'dropoff' for s in r.stops),
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
    }
)

# ========= TEST 3: Trip triggers 10-hr rest (>11 hrs driving) =========
run_test(
    '800mi trip (~13h driving) - should trigger 10-hr rest',
    [FakeLeg(300, 300), FakeLeg(500, 480)],
    cycle_used=0,
    expected_checks={
        '10-hr rest inserted': lambda r: any(s.stop_type == 'rest_10hr' for s in r.stops),
        'Rest is 600 min': lambda r: any(s.duration_minutes == 600 for s in r.stops if s.stop_type == 'rest_10hr'),
        'Multiple daily logs (>1 day)': lambda r: len(r.daily_logs) >= 2,
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
    }
)

# ========= TEST 4: High cycle hours (65 used) - triggers 34-hr restart =========
run_test(
    '600mi trip with 65 cycle hrs used - should trigger 34-hr restart',
    [FakeLeg(200, 200), FakeLeg(400, 400)],
    cycle_used=65,
    expected_checks={
        '34-hr restart inserted': lambda r: any(s.stop_type == 'restart_34hr' for s in r.stops),
        'Restart is 2040 min': lambda r: any(s.duration_minutes == 2040 for s in r.stops if s.stop_type == 'restart_34hr'),
        'Multiple daily logs (trip spans days)': lambda r: len(r.daily_logs) >= 2,
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
    }
)

# ========= TEST 5: Long trip with fuel stop (>1000 mi) =========
run_test(
    '1400mi trip - should trigger fuel stop',
    [FakeLeg(400, 400), FakeLeg(1000, 960)],
    cycle_used=0,
    expected_checks={
        'Fuel stop inserted': lambda r: any(s.stop_type == 'fuel' for s in r.stops),
        'Fuel stop is 15 min': lambda r: all(s.duration_minutes == 15 for s in r.stops if s.stop_type == 'fuel'),
        'Has rest (long trip)': lambda r: any(s.stop_type == 'rest_10hr' for s in r.stops),
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
    }
)

# ========= TEST 6: Verify driving never exceeds 11 hrs in a shift =========
def check_no_11hr_violation(result):
    shift_driving = 0
    for e in result.duty_events:
        dur = (e.end_time - e.start_time).total_seconds() / 60
        if e.status == 'driving':
            shift_driving += dur
            if shift_driving > DRIVING_LIMIT_MIN + 2:
                return False
        elif e.status == 'sleeper_berth' and dur >= 600:
            shift_driving = 0
    return True

run_test(
    '1400mi - verify no 11-hr driving violation',
    [FakeLeg(400, 400), FakeLeg(1000, 960)],
    cycle_used=0,
    expected_checks={
        'No 11-hr driving violation': check_no_11hr_violation,
    }
)

# ========= TEST 7: Verify 14-hr window not violated =========
def check_no_14hr_violation(result):
    shift_window = 0
    for e in result.duty_events:
        dur = (e.end_time - e.start_time).total_seconds() / 60
        if e.status == 'sleeper_berth' and dur >= 600:
            shift_window = 0
        else:
            shift_window += dur
            if e.status == 'driving' and shift_window > WINDOW_LIMIT_MIN + 2:
                return False
    return True

run_test(
    '1400mi - verify no 14-hr window violation',
    [FakeLeg(400, 400), FakeLeg(1000, 960)],
    cycle_used=0,
    expected_checks={
        'No 14-hr window violation': check_no_14hr_violation,
    }
)

# ========= TEST 8: 30-min break before 8 hrs cumulative driving =========
def check_break_before_8hrs(result):
    driving_since_break = 0
    for e in result.duty_events:
        dur = (e.end_time - e.start_time).total_seconds() / 60
        if e.status == 'driving':
            driving_since_break += dur
            if driving_since_break > BREAK_THRESHOLD_MIN + 2:
                return False
        elif e.status in ('off_duty', 'sleeper_berth') and dur >= 30:
            driving_since_break = 0
    return True

run_test(
    '500mi trip - verify break before 8 hrs driving',
    [FakeLeg(200, 200), FakeLeg(300, 300)],
    cycle_used=0,
    expected_checks={
        'Break before 8-hr cumulative driving': check_break_before_8hrs,
    }
)

# ========= TEST 9: Multi-day trip (2500 mi) =========
run_test(
    '2500mi cross-country trip - multi-day handling',
    [FakeLeg(800, 780), FakeLeg(1700, 1620)],
    cycle_used=20,
    expected_checks={
        'Multiple daily logs (3+ days)': lambda r: len(r.daily_logs) >= 3,
        'Has fuel stops': lambda r: sum(1 for s in r.stops if s.stop_type == 'fuel') >= 2,
        'Has rest stops': lambda r: sum(1 for s in r.stops if s.stop_type == 'rest_10hr') >= 2,
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
        'No 11-hr violation': check_no_11hr_violation,
        'No 14-hr violation': check_no_14hr_violation,
        'Break before 8h driving': check_break_before_8hrs,
    }
)

# ========= TEST 10: Edge case - starting at 70 hrs (immediate restart) =========
run_test(
    'Trip starting at exactly 70 cycle hrs - immediate 34-hr restart',
    [FakeLeg(100, 120), FakeLeg(100, 120)],
    cycle_used=70,
    expected_checks={
        '34-hr restart inserted': lambda r: any(s.stop_type == 'restart_34hr' for s in r.stops),
        'Restart happens before any driving': lambda r: (
            r.stops[0].stop_type == 'origin' and
            any(s.stop_type == 'restart_34hr' for s in r.stops[:3])
        ),
        'Daily logs sum to 24': lambda r: all(
            abs(l.total_off_duty + l.total_sleeper_berth + l.total_driving + l.total_on_duty_not_driving - 24.0) < 0.26
            for l in r.daily_logs
        ),
    }
)

# ========= PRINT RESULTS =========
print('\n' + '='*60)
print('HOS PLANNER TEST RESULTS')
print('='*60)
passed = 0
failed = 0
for name, status, errors, result in results:
    icon = 'PASS' if status == 'PASS' else 'FAIL'
    print(f'[{icon}] {name}')
    if status == 'PASS':
        # Print brief summary
        stops_summary = {}
        for s in result.stops:
            stops_summary[s.stop_type] = stops_summary.get(s.stop_type, 0) + 1
        print(f'       Stops: {stops_summary}')
        print(f'       Days: {len(result.daily_logs)}, Driving: {result.total_driving_minutes}min')
    for err in errors:
        print(err)
    if status == 'PASS':
        passed += 1
    else:
        failed += 1

print(f'\nTotal: {passed} passed, {failed} failed out of {len(results)} tests')

# Print daily log details for any failed test
for name, status, errors, result in results:
    if status == 'FAIL':
        print(f'\n--- Details for FAILED: {name} ---')
        for i, log in enumerate(result.daily_logs):
            total = log.total_off_duty + log.total_sleeper_berth + log.total_driving + log.total_on_duty_not_driving
            print(f'  Day {i+1} ({log.log_date}): off={log.total_off_duty:.2f} slp={log.total_sleeper_berth:.2f} drv={log.total_driving:.2f} od={log.total_on_duty_not_driving:.2f} = {total:.2f}h')
