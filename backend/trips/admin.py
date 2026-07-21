from django.contrib import admin

from .models import DailyLog, Driver, DutyStatusEvent, RouteStop, Trip, Vehicle


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ["name", "carrier_name", "home_terminal_tz", "created_at"]


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ["truck_number", "trailer_number", "license_plate", "license_state"]


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "current_location_label",
        "pickup_label",
        "dropoff_label",
        "total_distance_miles",
        "created_at",
    ]
    list_filter = ["created_at"]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ["trip", "sequence", "stop_type", "label", "arrival_time"]
    list_filter = ["stop_type"]


@admin.register(DutyStatusEvent)
class DutyStatusEventAdmin(admin.ModelAdmin):
    list_display = ["trip", "status", "start_time", "end_time", "location_label"]
    list_filter = ["status"]


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = [
        "trip",
        "log_date",
        "total_driving",
        "total_on_duty_not_driving",
        "total_off_duty",
        "total_sleeper_berth",
    ]
