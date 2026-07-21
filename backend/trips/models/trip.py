import uuid

from django.db import models


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    driver = models.ForeignKey(
        "trips.Driver", on_delete=models.SET_NULL, null=True, blank=True
    )
    vehicle = models.ForeignKey(
        "trips.Vehicle", on_delete=models.SET_NULL, null=True, blank=True
    )

    current_location_label = models.CharField(max_length=300)
    current_location_lat = models.FloatField()
    current_location_lng = models.FloatField()

    pickup_label = models.CharField(max_length=300)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()

    dropoff_label = models.CharField(max_length=300)
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()

    current_cycle_used_hours = models.FloatField(
        help_text="Hours already used in the rolling 8-day cycle (0-70)"
    )
    start_datetime = models.DateTimeField()

    total_distance_miles = models.FloatField(null=True, blank=True)
    total_driving_minutes = models.IntegerField(null=True, blank=True)
    total_trip_minutes = models.IntegerField(null=True, blank=True)
    route_geometry = models.JSONField(
        null=True, blank=True, help_text="GeoJSON LineString or encoded polyline"
    )

    shipper_name = models.CharField(max_length=200, blank=True, default="")
    commodity = models.CharField(max_length=200, blank=True, default="")
    bol_number = models.CharField(max_length=100, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip {self.id} ({self.current_location_label} → {self.dropoff_label})"
