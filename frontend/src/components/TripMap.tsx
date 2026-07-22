import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteStop, Trip } from "@/types/trip";
import { geoJsonToLatLngs } from "@/utils/polyline";

const STOP_COLORS: Record<string, string> = {
  origin: "#16a34a",       // emerald green
  pickup: "#2563eb",       // sapphire blue
  dropoff: "#9333ea",      // vibrant purple
  fuel: "#ea580c",         // vivid orange
  break_30min: "#ca8a04",  // warm amber
  rest_10hr: "#dc2626",    // crimson red
  restart_34hr: "#b91c1c", // deep red
  post_trip: "#4b5563",    // slate gray
};

const STOP_LABELS: Record<string, string> = {
  origin: "🟢 Origin",
  pickup: "🔵 Pickup",
  dropoff: "🟣 Drop-off",
  fuel: "⛽ Fuel Stop",
  break_30min: "☕ 30m Break",
  rest_10hr: "🛏️ 10h Rest",
  restart_34hr: "🔄 34h Restart",
  post_trip: "⏹️ Post-trip",
};

function createColoredIcon(color: string, isMajor: boolean = false) {
  const size = isMajor ? 20 : 16;
  const pulseSize = size + 8;
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; width: ${pulseSize}px; height: ${pulseSize}px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: ${pulseSize}px;
          height: ${pulseSize}px;
          border-radius: 50%;
          background-color: ${color};
          opacity: 0.3;
          animation: pulse 2s infinite ease-in-out;
        "></div>
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${color};
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          position: relative;
          z-index: 2;
        "></div>
      </div>
    `,
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize / 2, pulseSize / 2],
  });
}

interface TripMapProps {
  trip: Trip;
}

export default function TripMap({ trip }: TripMapProps) {
  // Get polyline from route geometry (GeoJSON LineString)
  let polylinePositions: [number, number][] = [];
  if (trip.route_geometry && (trip.route_geometry as any).coordinates) {
    polylinePositions = geoJsonToLatLngs(
      (trip.route_geometry as any).coordinates
    );
  }

  // Calculate map bounds from stops or polyline
  const bounds: [number, number][] =
    polylinePositions.length > 0
      ? polylinePositions
      : trip.stops.map((s) => [s.lat, s.lng] as [number, number]);

  if (bounds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 font-medium p-6">
        No route data available
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.85); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.15; }
          100% { transform: scale(0.85); opacity: 0.4; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          padding: 4px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
          z-index: 1;
        }
      `}</style>
      <MapContainer
        bounds={L.latLngBounds(bounds.map(([lat, lng]) => [lat, lng]))}
        boundsOptions={{ padding: [40, 40] }}
        className="h-full w-full rounded-2xl"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polylinePositions.length > 0 && (
          <>
            {/* Background Polyline Glow */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: "#2563eb", weight: 9, opacity: 0.25 }}
            />
            {/* Primary Polyline */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: "#2563eb", weight: 4.5, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
            />
          </>
        )}

        {trip.stops.map((stop: RouteStop) => {
          const isMajor = ["origin", "pickup", "dropoff"].includes(stop.stop_type);
          const color = STOP_COLORS[stop.stop_type] || "#6b7280";
          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={createColoredIcon(color, isMajor)}
            >
              <Popup>
                <div style={{ padding: "8px 12px", minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      backgroundColor: `${color}18`,
                      color: color,
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: `1px solid ${color}30`
                    }}>
                      {STOP_LABELS[stop.stop_type] || stop.stop_type}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>
                      Mi {Math.round(stop.cumulative_miles)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827", marginBottom: 4 }}>
                    {stop.label}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#4b5563", marginBottom: 4 }}>
                    ⏱️ {stop.duration_minutes} min duration
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                    {new Date(stop.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(stop.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {stop.notes && (
                    <div style={{ marginTop: 6, fontSize: "0.75rem", fontStyle: "italic", color: "#6b7280", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 4 }}>
                      {stop.notes}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Glassmorphic Legend Overlay */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 12,
        padding: "8px 12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        maxWidth: "calc(100% - 32px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STOP_COLORS.origin }}></span> Origin
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STOP_COLORS.pickup }}></span> Pickup
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STOP_COLORS.dropoff }}></span> Drop-off
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STOP_COLORS.fuel }}></span> Fuel
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STOP_COLORS.rest_10hr }}></span> Rest
        </div>
      </div>
    </div>
  );
}

