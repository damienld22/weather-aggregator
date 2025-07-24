export type RainPerHour = {
  value: number; // in mm
  hour: string; // ISO 8601 format, e.g., "2023-10-01T14:00:00Z"
  probability?: number; // percentage chance of rain
};
