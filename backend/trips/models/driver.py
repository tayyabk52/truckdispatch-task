from django.db import models


class Driver(models.Model):
    name = models.CharField(max_length=200)
    license_number = models.CharField(max_length=50, blank=True, default="")
    carrier_name = models.CharField(max_length=200, blank=True, default="")
    carrier_main_office = models.CharField(max_length=300, blank=True, default="")
    home_terminal_tz = models.CharField(
        max_length=50,
        default="America/Chicago",
        help_text="IANA timezone, e.g. America/Chicago",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
