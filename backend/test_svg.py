"""Test SVG grid accuracy - verify coordinates match duty events."""
import os, sys, django, re
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.dev'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from datetime import datetime, date, timedelta, time
from zoneinfo import ZoneInfo
from trips.services.log_renderer import (
    render_daily_log_svg, _time_to_x, _status_to_y, GRID_X, GRID_W, ROW_MIDLINES
)

tz = ZoneInfo('America/Chicago')
results = []


def test_time_to_x_accuracy():
    """Verify time-to-x coordinate conversion is correct."""
    errors = []

    # Midnight = left edge of grid (150)
    x_midnight = _time_to_x(0)
    if abs(x_midnight - GRID_X) > 0.01:
        errors.append(f'Midnight x should be {GRID_X}, got {x_midnight}')

    # Noon = middle of grid (150 + 480 = 630)
    x_noon = _time_to_x(12)
    expected_noon = GRID_X + GRID_W / 2
    if abs(x_noon - expected_noon) > 0.01:
        errors.append(f'Noon x should be {expected_noon}, got {x_noon}')

    # End midnight = right edge (150 + 960 = 1110)
    x_end = _time_to_x(24)
    expected_end = GRID_X + GRID_W
    if abs(x_end - expected_end) > 0.01:
        errors.append(f'End midnight x should be {expected_end}, got {x_end}')

    # 6:00 AM = 1/4 of the way
    x_6am = _time_to_x(6)
    expected_6am = GRID_X + GRID_W * 6 / 24
    if abs(x_6am - expected_6am) > 0.01:
        errors.append(f'6AM x should be {expected_6am}, got {x_6am}')

    return errors


def test_status_to_y():
    """Verify status-to-y coordinate conversion matches row midlines."""
    errors = []

    expected = {
        'off_duty': 155,
        'sleeper_berth': 205,
        'driving': 255,
        'on_duty_not_driving': 305,
    }

    for status, expected_y in expected.items():
        actual_y = _status_to_y(status)
        if actual_y != expected_y:
            errors.append(f'{status} y should be {expected_y}, got {actual_y}')

    return errors


def test_svg_contains_duty_lines():
    """Verify SVG has horizontal duty status lines for each event."""
    base = datetime(2026, 7, 22, 6, 0, tzinfo=tz)
    events = [
        {'start_time': base, 'end_time': base + timedelta(minutes=15),
         'status': 'on_duty_not_driving', 'location_label': 'Chicago, IL', 'remark': 'Pre-trip'},
        {'start_time': base + timedelta(minutes=15), 'end_time': base + timedelta(hours=4, minutes=15),
         'status': 'driving', 'location_label': 'Chicago, IL', 'remark': 'Driving'},
        {'start_time': base + timedelta(hours=4, minutes=15), 'end_time': base + timedelta(hours=5, minutes=15),
         'status': 'on_duty_not_driving', 'location_label': 'Indy, IN', 'remark': 'Pickup'},
        {'start_time': base + timedelta(hours=5, minutes=15), 'end_time': base + timedelta(hours=9),
         'status': 'driving', 'location_label': 'Indy, IN', 'remark': 'Driving'},
        {'start_time': base + timedelta(hours=9), 'end_time': base + timedelta(hours=10),
         'status': 'on_duty_not_driving', 'location_label': 'Columbus, OH', 'remark': 'Dropoff'},
    ]

    svg = render_daily_log_svg(
        log_date=date(2026, 7, 22),
        duty_events=events,
        total_miles=350,
        total_off_duty=14.0,
        total_sleeper_berth=0.0,
        total_driving=8.0,
        total_on_duty_nd=2.0,
        driver_name='Test Driver',
        carrier_name='Test Carrier',
        truck_number='T-100',
    )

    errors = []

    # Check SVG is valid
    if not svg.startswith('<svg'):
        errors.append('SVG does not start with <svg tag')
    if '</svg>' not in svg:
        errors.append('SVG does not end with </svg>')

    # Extract all line elements from the duty status group
    duty_group = re.search(r'<g stroke="#000000" stroke-width="2.5".*?</g>', svg, re.DOTALL)
    if not duty_group:
        errors.append('No duty status line group found in SVG')
        return errors

    lines = re.findall(r'<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"', duty_group.group())

    if len(lines) < 5:
        errors.append(f'Expected at least 5 lines (gaps filled + events), got {len(lines)}')

    # Check that we have lines at driving y (255) and on_duty y (305)
    driving_y = str(_status_to_y('driving'))
    on_duty_y = str(_status_to_y('on_duty_not_driving'))
    off_duty_y = str(_status_to_y('off_duty'))

    has_driving_line = any(y1 == driving_y and y2 == driving_y for x1, y1, x2, y2 in lines)
    has_on_duty_line = any(y1 == on_duty_y and y2 == on_duty_y for x1, y1, x2, y2 in lines)
    has_off_duty_line = any(y1 == off_duty_y and y2 == off_duty_y for x1, y1, x2, y2 in lines)

    if not has_driving_line:
        errors.append('No horizontal line at driving row (y=255)')
    if not has_on_duty_line:
        errors.append('No horizontal line at on_duty_not_driving row (y=305)')
    if not has_off_duty_line:
        errors.append('No horizontal line at off_duty row (y=155) for gap fill')

    # Check vertical connectors exist (lines where x1 == x2 but y1 != y2)
    vertical_lines = [(x1, y1, x2, y2) for x1, y1, x2, y2 in lines if x1 == x2 and y1 != y2]
    if len(vertical_lines) < 3:
        errors.append(f'Expected at least 3 vertical connectors, got {len(vertical_lines)}')

    # Verify specific time-to-x positions
    # Event at 6:00 (on_duty starts) = hour 6 = x = 150 + (6/24)*960 = 150 + 240 = 390
    expected_x_6am = _time_to_x(6)
    # Event at 6:15 (driving starts) = hour 6.25 = x = 150 + (6.25/24)*960 = 150 + 250 = 400
    expected_x_615 = _time_to_x(6.25)

    # Check the first on_duty line starts near x=390
    on_duty_horiz = [(x1, y1, x2, y2) for x1, y1, x2, y2 in lines
                     if y1 == on_duty_y and y2 == on_duty_y]
    if on_duty_horiz:
        first_on_duty_x1 = float(on_duty_horiz[0][0])
        if abs(first_on_duty_x1 - expected_x_6am) > 2:
            errors.append(f'First on_duty segment x1 should be ~{expected_x_6am:.1f} (6:00 AM), got {first_on_duty_x1:.1f}')

    return errors


def test_svg_totals_column():
    """Verify totals column values in SVG match inputs."""
    svg = render_daily_log_svg(
        log_date=date(2026, 7, 22),
        duty_events=[],
        total_miles=200,
        total_off_duty=14.0,
        total_sleeper_berth=0.0,
        total_driving=8.0,
        total_on_duty_nd=2.0,
    )

    errors = []

    # Check totals are in the SVG
    if '14.00' not in svg:
        errors.append('Off duty total (14.00) not found in SVG')
    if '0.00' not in svg:
        errors.append('Sleeper berth total (0.00) not found in SVG')
    if '8.00' not in svg:
        errors.append('Driving total (8.00) not found in SVG')
    if '2.00' not in svg:
        errors.append('On duty ND total (2.00) not found in SVG')
    if '= 24.00' not in svg:
        errors.append('Grand total (= 24.00) not found in SVG')

    return errors


def test_svg_header_fields():
    """Verify header fields render in SVG."""
    svg = render_daily_log_svg(
        log_date=date(2026, 7, 22),
        duty_events=[],
        total_miles=500,
        total_off_duty=24.0,
        total_sleeper_berth=0.0,
        total_driving=0.0,
        total_on_duty_nd=0.0,
        driver_name='John Doe',
        carrier_name='XYZ Transport',
        truck_number='T-9999',
        trailer_number='TR-5555',
        bol_number='BOL-12345',
    )

    errors = []

    if 'John Doe' not in svg:
        errors.append('Driver name not in SVG')
    if 'XYZ Transport' not in svg:
        errors.append('Carrier name not in SVG')
    if 'T-9999' not in svg:
        errors.append('Truck number not in SVG')
    if 'TR-5555' not in svg:
        errors.append('Trailer number not in SVG')
    if 'BOL-12345' not in svg:
        errors.append('BOL number not in SVG')
    if '07/22/2026' not in svg:
        errors.append('Date not in SVG')
    if '500' not in svg:
        errors.append('Total miles not in SVG')
    if "DRIVER" not in svg.upper():
        errors.append('Title missing from SVG')

    return errors


def test_svg_remarks_section():
    """Verify remarks section shows location changes."""
    base = datetime(2026, 7, 22, 8, 0, tzinfo=tz)
    events = [
        {'start_time': base, 'end_time': base + timedelta(hours=3),
         'status': 'driving', 'location_label': 'Chicago, IL', 'remark': 'Driving to pickup'},
        {'start_time': base + timedelta(hours=3), 'end_time': base + timedelta(hours=4),
         'status': 'on_duty_not_driving', 'location_label': 'Springfield, IL', 'remark': 'Pickup'},
    ]

    svg = render_daily_log_svg(
        log_date=date(2026, 7, 22),
        duty_events=events,
        total_miles=200,
        total_off_duty=20.0,
        total_sleeper_berth=0.0,
        total_driving=3.0,
        total_on_duty_nd=1.0,
    )

    errors = []

    if 'Chicago, IL' not in svg:
        errors.append('Chicago location not in remarks')
    if 'Springfield, IL' not in svg:
        errors.append('Springfield location not in remarks')
    if 'REMARKS' not in svg:
        errors.append('REMARKS header not found')

    return errors


def test_svg_grid_structure():
    """Verify grid has 24 hours, 4 rows, midnight/noon labels."""
    svg = render_daily_log_svg(
        log_date=date(2026, 7, 22),
        duty_events=[],
        total_miles=0,
        total_off_duty=24.0,
        total_sleeper_berth=0.0,
        total_driving=0.0,
        total_on_duty_nd=0.0,
    )

    errors = []

    if 'Noon' not in svg:
        errors.append('Noon label not found in grid')
    if 'night' not in svg:
        errors.append('Midnight label not found in grid')
    if 'Off Duty' not in svg:
        errors.append('Off Duty row label not found')
    if 'Sleeper Berth' not in svg:
        errors.append('Sleeper Berth row label not found')
    if 'Driving' not in svg:
        errors.append('Driving row label not found')
    if 'On Duty' not in svg:
        errors.append('On Duty row label not found')
    if 'Total' not in svg:
        errors.append('Totals column header not found')
    if 'RECAP' not in svg:
        errors.append('Recap section not found')
    if 'certify' not in svg:
        errors.append('Certification section not found')

    # Check 15-min tick marks exist
    tick_count = svg.count('stroke-width="0.5"')
    if tick_count < 100:
        errors.append(f'Expected 100+ tick marks, found {tick_count} stroke-width 0.5 elements')

    return errors


# ========= RUN ALL TESTS =========
tests = [
    ('Time-to-X coordinate accuracy', test_time_to_x_accuracy),
    ('Status-to-Y coordinate accuracy', test_status_to_y),
    ('SVG contains duty status lines', test_svg_contains_duty_lines),
    ('SVG totals column', test_svg_totals_column),
    ('SVG header fields', test_svg_header_fields),
    ('SVG remarks section', test_svg_remarks_section),
    ('SVG grid structure', test_svg_grid_structure),
]

print('\n' + '='*60)
print('SVG RENDERER TEST RESULTS')
print('='*60)

passed = 0
failed = 0
for name, test_fn in tests:
    errors = test_fn()
    status = 'PASS' if not errors else 'FAIL'
    print(f'[{status}] {name}')
    for err in errors:
        print(f'  {err}')
    if not errors:
        passed += 1
    else:
        failed += 1

print(f'\nTotal: {passed} passed, {failed} failed out of {len(tests)} tests')
