declare module "react-native-geolocation-service" {
  export type GeoError = {
    code: number;
    message: string;
    PERMISSION_DENIED?: number;
    POSITION_UNAVAILABLE?: number;
    TIMEOUT?: number;
  };

  export type GeoPosition = {
    coords: {
      accuracy: number;
      altitude: number | null;
      altitudeAccuracy?: number | null;
      heading: number | null;
      latitude: number;
      longitude: number;
      speed: number | null;
    };
    mocked?: boolean;
    timestamp: number;
  };

  export type AuthorizationStatus =
    | "disabled"
    | "granted"
    | "denied"
    | "restricted"
    | "authorized"
    | "whenInUse"
    | "always";

  export type GeoOptions = {
    timeout?: number;
    maximumAge?: number;
    enableHighAccuracy?: boolean;
    distanceFilter?: number;
    forceRequestLocation?: boolean;
    forceLocationManager?: boolean;
    showLocationDialog?: boolean;
    useSignificantChanges?: boolean;
  };

  type GeolocationStatic = {
    requestAuthorization(level?: "whenInUse" | "always"): Promise<AuthorizationStatus>;
    getCurrentPosition(
      success: (position: GeoPosition) => void,
      error?: (error: GeoError) => void,
      options?: GeoOptions
    ): void;
  };

  const Geolocation: GeolocationStatic;
  export default Geolocation;
}
