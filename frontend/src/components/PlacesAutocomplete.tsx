import { useEffect, useRef } from "react";
import { TextField, InputAdornment } from "@mui/material";

interface PlacesAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: boolean;
  size?: "small" | "medium";
}

declare global {
  interface Window {
    google: typeof google;
  }
}

/**
 * Address input backed by Google Places Autocomplete. Falls back to a
 * plain text field when the Places library is unavailable, so trips can
 * always be entered manually. (Autocomplete wiring is unchanged from the
 * original implementation — only presentational props were added.)
 */
export default function PlacesAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  icon,
  required,
  helperText,
  error,
  size = "medium",
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode", "establishment"],
        fields: ["formatted_address", "name"],
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name || "";
      onChange(address);
    });

    autocompleteRef.current = autocomplete;
  }, [onChange]);

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      inputRef={inputRef}
      helperText={helperText}
      error={error}
      size={size}
      slotProps={{
        input: icon
          ? {
              startAdornment: (
                <InputAdornment position="start">{icon}</InputAdornment>
              ),
            }
          : undefined,
      }}
    />
  );
}
