"""
Serializers for the trips API.
"""

from datetime import datetime, timezone

from rest_framework import serializers

from trips.models import Trip, RouteStop, DutyStatusEvent, DailyLog
from trips.services.trip_service import create_trip, TripCreationError


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = [
            "id",
            "sequence",
            "stop_type",
            "label",
            "lat",
            "lng",
            "arrival_time",
            "departure_time",
            "duration_minutes",
            "cumulative_miles",
            "notes",
        ]


class DutyStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutyStatusEvent
        fields = [
            "id",
            "start_time",
            "end_time",
            "status",
            "location_label",
            "lat",
            "lng",
            "remark",
        ]


class DailyLogSerializer(serializers.ModelSerializer):
    svg_url = serializers.SerializerMethodField()

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "log_date",
            "total_miles_driving_today",
            "total_off_duty",
            "total_sleeper_berth",
            "total_driving",
            "total_on_duty_not_driving",
            "shipping_doc_number",
            "svg_url",
        ]

    def get_svg_url(self, obj):
        return f"/trips/{obj.trip_id}/logs/{obj.id}/svg/"


class TripDetailSerializer(serializers.ModelSerializer):
    """Read serializer: returns the full trip with nested stops, events, logs."""

    stops = RouteStopSerializer(many=True, read_only=True)
    duty_events = DutyStatusEventSerializer(many=True, read_only=True)
    daily_logs = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location_label",
            "current_location_lat",
            "current_location_lng",
            "pickup_label",
            "pickup_lat",
            "pickup_lng",
            "dropoff_label",
            "dropoff_lat",
            "dropoff_lng",
            "current_cycle_used_hours",
            "start_datetime",
            "total_distance_miles",
            "total_driving_minutes",
            "total_trip_minutes",
            "route_geometry",
            "shipper_name",
            "commodity",
            "bol_number",
            "created_at",
            "stops",
            "duty_events",
            "daily_logs",
        ]

    def get_daily_logs(self, obj):
        logs = obj.daily_logs.all().order_by("log_date")
        return DailyLogSerializer(logs, many=True).data


class TripCreateSerializer(serializers.Serializer):
    """
    Write serializer: accepts the trip creation payload and orchestrates
    routing + HOS planning + model creation.
    """

    current_location = serializers.CharField(max_length=500)
    pickup_location = serializers.CharField(max_length=500)
    dropoff_location = serializers.CharField(max_length=500)
    current_cycle_used_hours = serializers.FloatField(min_value=0, max_value=70)
    start_datetime = serializers.DateTimeField(required=False, allow_null=True)

    # Optional driver/carrier fields
    driver_name = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    carrier_name = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    main_office = serializers.CharField(max_length=300, required=False, default="", allow_blank=True)
    truck_number = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    trailer_number = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    co_driver = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)

    # Optional shipping fields
    shipper_name = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    commodity = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    bol_number = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)

    def validate(self, attrs):
        # Default start_datetime to now if not provided
        if not attrs.get("start_datetime"):
            attrs["start_datetime"] = datetime.now(timezone.utc)

        # Pickup and dropoff must differ
        pickup = attrs["pickup_location"].strip().lower()
        dropoff = attrs["dropoff_location"].strip().lower()
        if pickup == dropoff:
            raise serializers.ValidationError(
                {"dropoff_location": "Pickup and drop-off must be different locations."}
            )

        return attrs

    def create(self, validated_data):
        try:
            trip = create_trip(validated_data)
        except TripCreationError as e:
            raise serializers.ValidationError({"detail": str(e)})
        return trip

    def to_representation(self, instance):
        """After creation, return the full trip detail representation."""
        return TripDetailSerializer(instance).data
