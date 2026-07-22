"""
Google Maps routing service.

Provides geocoding and directions using the Google Maps Platform APIs
via the official googlemaps Python client.
"""

from dataclasses import dataclass, field

import googlemaps
from django.conf import settings


class RoutingServiceError(Exception):
    """Raised when the routing service encounters an error."""
    pass


@dataclass
class LatLng:
    lat: float
    lng: float


@dataclass
class LegResult:
    distance_miles: float
    duration_minutes: float
    start_address: str
    end_address: str
    polyline_points: list[tuple[float, float]]  # list of (lat, lng)


@dataclass
class RouteResult:
    origin: LatLng
    origin_address: str
    pickup: LatLng
    pickup_address: str
    dropoff: LatLng
    dropoff_address: str
    total_distance_miles: float
    total_duration_minutes: float
    legs: list[LegResult] = field(default_factory=list)
    polyline_points: list[tuple[float, float]] = field(default_factory=list)
    route_geometry: dict | None = None  # GeoJSON LineString


def _get_client() -> googlemaps.Client:
    key = settings.GOOGLE_MAPS_API_KEY
    if not key:
        raise RoutingServiceError("GOOGLE_MAPS_API_KEY is not configured")
    return googlemaps.Client(key=key)


def geocode(address: str) -> dict:
    """
    Resolve an address string to lat/lng coordinates.

    Returns: {"lat": float, "lng": float, "formatted_address": str}
    """
    client = _get_client()
    try:
        results = client.geocode(address)
    except googlemaps.exceptions.ApiError as e:
        raise RoutingServiceError(f"Geocoding API error: {e}")
    except Exception as e:
        raise RoutingServiceError(f"Geocoding request failed: {e}")

    if not results:
        raise RoutingServiceError(f"Could not geocode address: {address}")

    location = results[0]["geometry"]["location"]
    return {
        "lat": location["lat"],
        "lng": location["lng"],
        "formatted_address": results[0]["formatted_address"],
    }


def get_directions(
    origin: tuple[float, float],
    destination: tuple[float, float],
    waypoints: list[tuple[float, float]] | None = None,
) -> dict:
    """
    Get driving directions between points.

    Returns dict with keys: distance_miles, duration_minutes, legs, polyline_points
    """
    client = _get_client()

    wp = None
    if waypoints:
        wp = [{"lat": lat, "lng": lng} for lat, lng in waypoints]

    try:
        result = client.directions(
            origin={"lat": origin[0], "lng": origin[1]},
            destination={"lat": destination[0], "lng": destination[1]},
            waypoints=wp,
            mode="driving",
            units="imperial",
        )
    except googlemaps.exceptions.ApiError as e:
        raise RoutingServiceError(f"Directions API error: {e}")
    except Exception as e:
        raise RoutingServiceError(f"Directions request failed: {e}")

    if not result:
        raise RoutingServiceError("No route found between the given locations")

    route = result[0]
    legs = []
    all_points = []
    total_distance_meters = 0
    total_duration_seconds = 0

    for leg in route["legs"]:
        leg_distance_meters = leg["distance"]["value"]
        leg_duration_seconds = leg["duration"]["value"]
        total_distance_meters += leg_distance_meters
        total_duration_seconds += leg_duration_seconds

        leg_points = []
        for step in leg["steps"]:
            points = googlemaps.convert.decode_polyline(
                step["polyline"]["points"]
            )
            for pt in points:
                coord = (pt["lat"], pt["lng"])
                leg_points.append(coord)
                all_points.append(coord)

        legs.append(LegResult(
            distance_miles=leg_distance_meters / 1609.34,
            duration_minutes=leg_duration_seconds / 60,
            start_address=leg["start_address"],
            end_address=leg["end_address"],
            polyline_points=leg_points,
        ))

    return {
        "distance_miles": total_distance_meters / 1609.34,
        "duration_minutes": total_duration_seconds / 60,
        "legs": legs,
        "polyline_points": all_points,
    }


def get_route(current: str, pickup: str, dropoff: str) -> RouteResult:
    """
    Full routing pipeline: geocode all 3 addresses, then get directions.
    """
    origin_geo = geocode(current)
    pickup_geo = geocode(pickup)
    dropoff_geo = geocode(dropoff)

    origin_latlng = (origin_geo["lat"], origin_geo["lng"])
    pickup_latlng = (pickup_geo["lat"], pickup_geo["lng"])
    dropoff_latlng = (dropoff_geo["lat"], dropoff_geo["lng"])

    directions = get_directions(
        origin=origin_latlng,
        destination=dropoff_latlng,
        waypoints=[pickup_latlng],
    )

    geojson = {
        "type": "LineString",
        "coordinates": [[lng, lat] for lat, lng in directions["polyline_points"]],
    }

    return RouteResult(
        origin=LatLng(lat=origin_geo["lat"], lng=origin_geo["lng"]),
        origin_address=origin_geo["formatted_address"],
        pickup=LatLng(lat=pickup_geo["lat"], lng=pickup_geo["lng"]),
        pickup_address=pickup_geo["formatted_address"],
        dropoff=LatLng(lat=dropoff_geo["lat"], lng=dropoff_geo["lng"]),
        dropoff_address=dropoff_geo["formatted_address"],
        total_distance_miles=directions["distance_miles"],
        total_duration_minutes=directions["duration_minutes"],
        legs=directions["legs"],
        polyline_points=directions["polyline_points"],
        route_geometry=geojson,
    )
