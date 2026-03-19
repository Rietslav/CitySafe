import { NativeModules, Platform } from "react-native";

declare const process: {
	env: Record<string, string | undefined>;
};

const DEFAULT_API_PORT = Number(process.env.MOBILE_API_PORT ?? "4000");
const envBaseUrl = process.env.MOBILE_API_BASE_URL;

type PlatformConstants = {
	Brand?: string;
	Device?: string;
	Fingerprint?: string;
	Manufacturer?: string;
	Model?: string;
	Product?: string;
	serverHost?: string;
};

function getPlatformConstants(): PlatformConstants {
	return (Platform.constants ?? NativeModules.PlatformConstants ?? {}) as PlatformConstants;
}

function isAndroidEmulator() {
	if (Platform.OS !== "android") {
		return false;
	}

	const constants = getPlatformConstants();
	const candidates = [
		constants.Brand,
		constants.Device,
		constants.Fingerprint,
		constants.Manufacturer,
		constants.Model,
		constants.Product
	]
		.filter(Boolean)
		.map(value => value!.toLowerCase());

	const emulatorIndicators = [
		"emulator",
		"simulator",
		"sdk",
		"sdk_gphone",
		"google_sdk",
		"x86",
		"generic"
	];

	return candidates.some(value => emulatorIndicators.some(token => value.includes(token)));
}

function normalizeBaseUrl(url: string) {
	return url.trim().replace(/\/+$/, "");
}

function hostFromScriptUrl() {
	const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
	if (!scriptURL) return undefined;

	const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?/i);
	return match?.[1];
}

function hostFromPlatformConstants() {
	const serverHost = getPlatformConstants().serverHost; // format: "192.168.0.10:8081"
	if (!serverHost) return undefined;

	const [host] = serverHost.split(":");
	return host;
}

function hostFromDevSettings() {
	const serverHost: string | undefined = NativeModules?.DevSettings?.getServerHost?.();
	if (!serverHost) return undefined;

	const [host] = serverHost.split(":");
	return host;
}

function hostFromDevServer() {
	return hostFromScriptUrl() ?? hostFromPlatformConstants() ?? hostFromDevSettings();
}

function resolveApiBaseUrl() {
	const devHost = hostFromDevServer();

	if (devHost) {
		if (Platform.OS === "android" && (devHost === "localhost" || devHost === "127.0.0.1")) {
			return isAndroidEmulator()
				? `http://10.0.2.2:${DEFAULT_API_PORT}`
				: `http://localhost:${DEFAULT_API_PORT}`;
		}

		return `http://${devHost}:${DEFAULT_API_PORT}`;
	}

	if (Platform.OS === "android" && !isAndroidEmulator()) {
		console.warn(
			"Nu am putut detecta hostul Metro. Seteaza MOBILE_API_BASE_URL sau MOBILE_API_PORT pentru a specifica API-ul explicit."
		);
	}

	return Platform.OS === "android" ? `http://10.0.2.2:${DEFAULT_API_PORT}` : `http://localhost:${DEFAULT_API_PORT}`;
}

export const API_BASE_URL = envBaseUrl ? normalizeBaseUrl(envBaseUrl) : resolveApiBaseUrl();
