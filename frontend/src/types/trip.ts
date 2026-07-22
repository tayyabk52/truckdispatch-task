export interface Driver {
  id: number;
  name: string;
  license_number: string;
  carrier_name: string;
  carrier_main_office: string;
  home_terminal_tz: string;
}

export interface Vehicle {
  id: number;
  truck_number: string;
  trailer_number: string;
  license_plate: string;
  license_state: string;
}

export type StopType =
  | "origin"
  | "pickup"
  | "dropoff"
  | "fuel"
  | "break_30min"
  | "rest_10hr"
  | "restart_34hr"
  | "post_trip";

export type DutyStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty_not_driving";

export interface RouteStop {
  id: number;
  sequence: number;
  stop_type: StopType;
  label: string;
  lat: number;
  lng: number;
  arrival_time: string;
  departure_time: string;
  duration_minutes: number;
  cumulative_miles: number;
  notes: string;
}

export interface DutyStatusEvent {
  id: number;
  start_time: string;
  end_time: string;
  status: DutyStatus;
  location_label: string;
  lat: number;
  lng: number;
  remark: string;
}

export interface DailyLog {
  id: number;
  log_date: string;
  total_miles_driving_today: number;
  total_off_duty: number;
  total_sleeper_berth: number;
  total_driving: number;
  total_on_duty_not_driving: number;
  shipping_doc_number: string;
  svg_url: string;
}

export interface Trip {
  id: string;
  current_location_label: string;
  current_location_lat: number;
  current_location_lng: number;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lng: number;
  current_cycle_used_hours: number;
  start_datetime: string;
  total_distance_miles: number | null;
  total_driving_minutes: number | null;
  total_trip_minutes: number | null;
  route_geometry: object | null;
  shipper_name: string;
  commodity: string;
  bol_number: string;
  created_at: string;
  stops: RouteStop[];
  duty_events: DutyStatusEvent[];
  daily_logs: DailyLog[];
}

export interface TripCreatePayload {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  start_datetime?: string;
  driver_name?: string;
  carrier_name?: string;
  main_office?: string;
  truck_number?: string;
  trailer_number?: string;
  co_driver?: string;
  shipper_name?: string;
  commodity?: string;
  bol_number?: string;
}
