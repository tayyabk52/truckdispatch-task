from django.db import models


class RouteStop(models.Model):
    class StopType(models.TextChoices):
        ORIGIN = "origin", "Origin"
        PICKUP = "pickup", "Pickup"
        DROPOFF = "dropoff", "Drop-off"
        FUEL = "fuel", "Fuel Stop"
        BREAK_30MIN = "break_30min", "30-Minute Break"
        REST_10HR = "rest_10hr", "10-Hour Rest"
        RESTART_34HR = "restart_34hr", "34-Hour Restart"
        POST_TRIP = "post_trip", "Post-Trip"

    trip = models.ForeignKey(
        "trips.Trip", on_delete=models.CASCADE, related_name="stops"
    )
    sequence = models.IntegerField()
    stop_type = models.CharField(max_length=20, choices=StopType.choices)
    label = models.CharField(max_length=300)
    lat = models.FloatField()
    lng = models.FloatField()
    arrival_time = models.DateTimeField()
    departure_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    cumulative_miles = models.FloatField(default=0)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["trip", "sequence"]

    def __str__(self):
        return f"{self.get_stop_type_display()} @ {self.label}"
