from django.db import models


class DutyStatusEvent(models.Model):
    class Status(models.TextChoices):
        OFF_DUTY = "off_duty", "Off Duty"
        SLEEPER_BERTH = "sleeper_berth", "Sleeper Berth"
        DRIVING = "driving", "Driving"
        ON_DUTY_NOT_DRIVING = "on_duty_not_driving", "On Duty (Not Driving)"

    trip = models.ForeignKey(
        "trips.Trip", on_delete=models.CASCADE, related_name="duty_events"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=25, choices=Status.choices)
    location_label = models.CharField(max_length=300)
    lat = models.FloatField()
    lng = models.FloatField()
    remark = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["trip", "start_time"]

    def __str__(self):
        return f"{self.get_status_display()} ({self.start_time} → {self.end_time})"
