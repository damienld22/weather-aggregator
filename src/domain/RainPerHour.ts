export type RainPerHour = {
  value: number; // in mm
  hour: string; // ISO 8601 format, e.g., "2023-10-01T14:00:00Z"
  probability?: number; // percentage chance of rain
};

export type RainApiName = "meteociel" | "unknown";

export type RainPerHourInformations = {
  updatedAt: string; // ISO 8601 format, e.g., "2023-10-01T14:00:00Z"
  data: RainPerHour[];
};

export type RainPerHourListByApi = {
  [apiName in RainApiName]: RainPerHourInformations;
};
