"""
API views for trips.
"""

import logging

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from trips.models import Trip, DailyLog
from trips.serializers import TripCreateSerializer, TripDetailSerializer
from trips.services.log_renderer import render_log_for_trip

logger = logging.getLogger(__name__)


class TripCreateView(generics.CreateAPIView):
    """
    POST /api/trips/

    Accepts trip inputs (addresses, cycle hours, etc.), runs routing + HOS
    planning, and returns the fully-populated trip.
    """

    serializer_class = TripCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            trip = serializer.save()
        except Exception:
            logger.exception("Unexpected error creating trip")
            return Response(
                {"detail": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Return the full trip detail
        output = TripDetailSerializer(trip).data
        return Response(output, status=status.HTTP_201_CREATED)


class TripDetailView(generics.RetrieveAPIView):
    """
    GET /api/trips/<uuid:pk>/

    Returns the full trip with nested stops, duty events, and daily logs.
    """

    serializer_class = TripDetailSerializer
    queryset = Trip.objects.prefetch_related(
        "stops", "duty_events", "daily_logs"
    )
    lookup_field = "pk"


@api_view(["GET"])
def daily_log_svg_view(request, trip_pk, log_pk):
    """
    GET /api/trips/<uuid:trip_pk>/logs/<int:log_pk>/svg/

    Returns the rendered SVG for a specific daily log.
    """
    trip = get_object_or_404(
        Trip.objects.prefetch_related("duty_events", "daily_logs"),
        pk=trip_pk,
    )
    daily_log = get_object_or_404(DailyLog, pk=log_pk, trip=trip)

    # Use cached SVG if available
    if daily_log.generated_svg:
        svg_content = daily_log.generated_svg
    else:
        duty_events = list(trip.duty_events.all().order_by("start_time"))
        svg_content = render_log_for_trip(daily_log, duty_events, trip)
        daily_log.generated_svg = svg_content
        daily_log.save(update_fields=["generated_svg"])

    return HttpResponse(svg_content, content_type="image/svg+xml")
