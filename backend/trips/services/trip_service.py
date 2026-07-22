"""
Trip orchestrator service.

Coordinates the full trip creation flow:
routing → HOS planning → model persistence.
"""

import logging
from datetime import datetime, timezone

from django.db import transaction
from timezonefinder import TimezoneFinder

from trips.models import Trip, RouteStop, DutyStatusEvent, DailyLog, Driver, Vehicle
from trips.services.routing import get_route, RoutingServiceError
from trips.services.hos_planner import plan_trip, PlanResult
from trips.services.log_renderer import render_log_for_trip

logger = logging.getLogger(__name__)
_tf = TimezoneFinder()


class TripCreationError(Exception):
    """Raised when trip creation fails."""
    pass


@transaction.atomic
def create_trip(validated_data: dict) -> Trip:
    """
    Create a complete trip with route, HOS-compliant stops, duty events,
    and daily logs.

    Args:
        validated_data: dict with keys:
            - current_location (str): address
            - pickup_location (str): address
            - dropoff_location (str): address
            - current_cycle_used_hours (float): 0-70
            - start_datetime (datetime, optional): defaults to now
            - driver_name, carrier_name, etc. (optional)
            - shipper_name, commodity, bol_number (optional)

    Returns: Trip instance with all related objects created.
    Raises: TripCreationError on failure.
    """
    # 1. Route via Google Maps
    try:
        route = get_route(
            current=validated_data["current_location"],
            pickup=validated_data["pickup_location"],
            dropoff=validated_data["dropoff_location"],
        )
    except RoutingServiceError as e:
        raise TripCreationError(f"Routing failed: {e}")

    # Determine driver's home terminal timezone from origin coordinates
    home_tz = _tf.timezone_at(lat=route.origin.lat, lng=route.origin.lng) or "America/Chicago"

    # 2. Create Driver / Vehicle if info provided
    start_dt = validated_data.get("start_datetime") or datetime.now(timezone.utc)

    driver = None
    driver_name = validated_data.get("driver_name", "").strip()
    if driver_name:
        driver = Driver.objects.create(
            name=driver_name,
            carrier_name=validated_data.get("carrier_name", ""),
            carrier_main_office=validated_data.get("main_office", ""),
        )

    vehicle = None
    truck_number = validated_data.get("truck_number", "").strip()
    if truck_number:
        vehicle = Vehicle.objects.create(
            truck_number=truck_number,
            trailer_number=validated_data.get("trailer_number", ""),
        )

    # 3. Create Trip model
    trip = Trip.objects.create(
        driver=driver,
        vehicle=vehicle,
        current_location_label=route.origin_address,
        current_location_lat=route.origin.lat,
        current_location_lng=route.origin.lng,
        pickup_label=route.pickup_address,
        pickup_lat=route.pickup.lat,
        pickup_lng=route.pickup.lng,
        dropoff_label=route.dropoff_address,
        dropoff_lat=route.dropoff.lat,
        dropoff_lng=route.dropoff.lng,
        current_cycle_used_hours=validated_data["current_cycle_used_hours"],
        start_datetime=start_dt,
        route_geometry=route.route_geometry,
        total_distance_miles=route.total_distance_miles,
        shipper_name=validated_data.get("shipper_name", ""),
        commodity=validated_data.get("commodity", ""),
        bol_number=validated_data.get("bol_number", ""),
    )

    # 3. Run HOS planner
    try:
        plan = plan_trip(
            legs=route.legs,
            origin_address=route.origin_address,
            origin_lat=route.origin.lat,
            origin_lng=route.origin.lng,
            pickup_address=route.pickup_address,
            pickup_lat=route.pickup.lat,
            pickup_lng=route.pickup.lng,
            dropoff_address=route.dropoff_address,
            dropoff_lat=route.dropoff.lat,
            dropoff_lng=route.dropoff.lng,
            total_distance_miles=route.total_distance_miles,
            polyline_points=route.polyline_points,
            cycle_used_hours=validated_data["current_cycle_used_hours"],
            start_time=start_dt,
            home_tz=home_tz,
            bol_number=validated_data.get("bol_number", ""),
        )
    except Exception as e:
        logger.exception("HOS planning failed")
        raise TripCreationError(f"HOS planning failed: {e}")

    # 4. Update trip totals
    trip.total_driving_minutes = plan.total_driving_minutes
    trip.total_trip_minutes = plan.total_trip_minutes
    trip.save(update_fields=["total_driving_minutes", "total_trip_minutes"])

    # 5. Bulk-create RouteStops
    RouteStop.objects.bulk_create([
        RouteStop(
            trip=trip,
            sequence=stop.sequence,
            stop_type=stop.stop_type,
            label=stop.label,
            lat=stop.lat,
            lng=stop.lng,
            arrival_time=stop.arrival_time,
            departure_time=stop.departure_time,
            duration_minutes=stop.duration_minutes,
            cumulative_miles=stop.cumulative_miles,
            notes=stop.notes,
        )
        for stop in plan.stops
    ])

    # 6. Bulk-create DutyStatusEvents
    DutyStatusEvent.objects.bulk_create([
        DutyStatusEvent(
            trip=trip,
            start_time=event.start_time,
            end_time=event.end_time,
            status=event.status,
            location_label=event.location_label,
            lat=event.lat,
            lng=event.lng,
            remark=event.remark,
        )
        for event in plan.duty_events
    ])

    # 7. Bulk-create DailyLogs
    DailyLog.objects.bulk_create([
        DailyLog(
            trip=trip,
            log_date=log.log_date,
            total_miles_driving_today=log.total_miles_driving_today,
            total_off_duty=log.total_off_duty,
            total_sleeper_berth=log.total_sleeper_berth,
            total_driving=log.total_driving,
            total_on_duty_not_driving=log.total_on_duty_not_driving,
            shipping_doc_number=log.shipping_doc_number,
        )
        for log in plan.daily_logs
    ])

    logger.info(
        "Trip %s created: %.1f mi, %d stops, %d events, %d daily logs",
        trip.id,
        route.total_distance_miles,
        len(plan.stops),
        len(plan.duty_events),
        len(plan.daily_logs),
    )

    # 8. Generate SVG for each daily log (cached in DB)
    all_events = list(trip.duty_events.all().order_by("start_time"))
    co_driver_name = validated_data.get("co_driver", "")
    for log in trip.daily_logs.all():
        try:
            svg = render_log_for_trip(
                log, all_events, trip,
                co_driver=co_driver_name,
                home_tz=home_tz,
            )
            log.generated_svg = svg
            log.save(update_fields=["generated_svg"])
        except Exception:
            logger.warning("SVG generation failed for log %s", log.id)

    return trip
