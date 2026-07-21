from django.db import models


class Vehicle(models.Model):
    truck_number = models.CharField(max_length=50)
    trailer_number = models.CharField(max_length=50, blank=True, default="")
    license_plate = models.CharField(max_length=20, blank=True, default="")
    license_state = models.CharField(max_length=2, blank=True, default="")

    def __str__(self):
        return f"Truck #{self.truck_number}"
