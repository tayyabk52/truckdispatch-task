import apiClient from "./client";
import type { Trip, TripCreatePayload } from "@/types/trip";

export async function createTrip(payload: TripCreatePayload): Promise<Trip> {
  const response = await apiClient.post<Trip>("/trips/", payload);
  return response.data;
}

export async function getTrip(id: string): Promise<Trip> {
  const response = await apiClient.get<Trip>(`/trips/${id}/`);
  return response.data;
}

export function getTripPdfUrl(id: string): string {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
  return `${baseUrl}/trips/${id}/logs.pdf`;
}
