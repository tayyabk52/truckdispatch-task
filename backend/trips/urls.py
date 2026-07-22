from django.urls import path

from trips.views import TripCreateView, TripDetailView, daily_log_svg_view

urlpatterns = [
    path("trips/", TripCreateView.as_view(), name="trip-create"),
    path("trips/<uuid:pk>/", TripDetailView.as_view(), name="trip-detail"),
    path(
        "trips/<uuid:trip_pk>/logs/<int:log_pk>/svg/",
        daily_log_svg_view,
        name="daily-log-svg",
    ),
]
