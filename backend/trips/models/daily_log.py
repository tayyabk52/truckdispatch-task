from django.db import models


class DailyLog(models.Model):
    trip = models.ForeignKey(
        "trips.Trip", on_delete=models.CASCADE, related_name="daily_logs"
    )
    log_date = models.DateField(help_text="Date in home-terminal timezone")
    total_miles_driving_today = models.IntegerField(default=0)
    total_off_duty = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_sleeper_berth = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_driving = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    total_on_duty_not_driving = models.DecimalField(
        max_digits=4, decimal_places=2, default=0
    )
    shipping_doc_number = models.CharField(max_length=100, blank=True, default="")
    driver_signature = models.CharField(max_length=200, blank=True, default="")
    generated_svg = models.TextField(blank=True, default="")
    generated_pdf = models.FileField(upload_to="logs/", blank=True, null=True)

    class Meta:
        ordering = ["trip", "log_date"]
        unique_together = ["trip", "log_date"]

    def __str__(self):
        return f"Log {self.log_date} for Trip {self.trip_id}"
