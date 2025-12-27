/**
 * Base path utilities for configurable sub-path deployments.
 *
 * SigNoz can be deployed at a sub-path (e.g., /signoz/ or /admin/observe/)
 * instead of the root path (/). This module provides utilities to handle
 * routing and URL construction in such deployments.
 *
 * The base path is injected by the backend at runtime via window.__SIGNOZ_CONFIG__.
 * This allows the same frontend build to work with any base path without rebuilding.
 */

// Extend Window interface to include our runtime config
declare global {
	interface Window {
		__SIGNOZ_CONFIG__?: {
			basePath?: string;
		};
	}
}

/**
 * Gets the configured base path for the application.
 *
 * Priority order:
 * 1. Runtime config injected by backend (window.__SIGNOZ_CONFIG__.basePath)
 * 2. Build-time environment variable (process.env.BASE_PATH)
 * 3. Default to '/'
 *
 * @returns The base path, always ending with '/'
 */
export function getBasePath(): string {
	let basePath = '/';

	// Check for runtime injected config first (set by Go backend)
	if (typeof window !== 'undefined' && window.__SIGNOZ_CONFIG__?.basePath) {
		basePath = window.__SIGNOZ_CONFIG__.basePath;
	} else if (process?.env?.BASE_PATH) {
		// Fall back to build-time environment variable
		basePath = process.env.BASE_PATH;
	}

	// Ensure the path ends with '/' for consistency
	if (!basePath.endsWith('/')) {
		basePath = `${basePath}/`;
	}

	return basePath;
}

/**
 * Gets the base path without trailing slash, suitable for use as
 * React Router's basename.
 *
 * @returns The base path without trailing slash, or empty string for root
 */
export function getRouterBasename(): string {
	const basePath = getBasePath();
	// Remove trailing slash for router basename
	// For root path '/', return empty string (router default)
	if (basePath === '/') {
		return '';
	}
	return basePath.slice(0, -1);
}

/**
 * Constructs a full URL path including the base path.
 * Use this for constructing URLs that will be used for navigation or links.
 *
 * @param path - The path to append to the base path (with or without leading /)
 * @returns The full path including base path
 *
 * @example
 * // If basePath is '/signoz/'
 * getFullPath('/dashboard/1') // returns '/signoz/dashboard/1'
 * getFullPath('dashboard/1')  // returns '/signoz/dashboard/1'
 */
export function getFullPath(path: string): string {
	const basePath = getBasePath();
	// Remove leading slash from path if present to avoid double slashes
	const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
	return `${basePath}${normalizedPath}`;
}

/**
 * Constructs a full absolute URL including origin and base path.
 * Use this for shareable links that need to include the full URL.
 *
 * @param path - The path to append (with or without leading /)
 * @returns The full absolute URL
 *
 * @example
 * // If origin is 'https://example.com' and basePath is '/signoz/'
 * getFullUrl('/dashboard/1') // returns 'https://example.com/signoz/dashboard/1'
 */
export function getFullUrl(path: string): string {
	if (typeof window === 'undefined') {
		return getFullPath(path);
	}
	const fullPath = getFullPath(path);
	// Remove leading slash since origin doesn't have trailing slash
	const pathWithoutLeadingSlash = fullPath.startsWith('/')
		? fullPath.slice(1)
		: fullPath;
	return `${window.location.origin}/${pathWithoutLeadingSlash}`;
}

/**
 * Constructs a shareable URL with optional query string.
 * Use this for URLs that will be copied to clipboard or shared.
 *
 * @param path - The path to append (with or without leading /)
 * @param queryString - Optional query string (without leading ?)
 * @returns The full shareable URL with optional query string
 *
 * @example
 * // If origin is 'https://example.com' and basePath is '/signoz/'
 * getShareableUrl('/traces', 'id=123') // returns 'https://example.com/signoz/traces?id=123'
 */
export function getShareableUrl(path: string, queryString?: string): string {
	const baseUrl = getFullUrl(path);
	return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Gets the frontend base URL (origin + base path) for use in API calls
 * that need to know where the frontend is served from.
 *
 * @returns The frontend base URL (e.g., 'https://example.com/signoz')
 */
export function getFrontendBaseUrl(): string {
	if (typeof window === 'undefined') {
		return '';
	}
	const basePath = getBasePath();
	// Remove trailing slash for the base URL
	const basePathWithoutTrailingSlash = basePath.endsWith('/')
		? basePath.slice(0, -1)
		: basePath;
	return `${window.location.origin}${basePathWithoutTrailingSlash}`;
}

/**
 * Constructs a URL for static assets (images, icons, logos, etc.).
 * Use this for referencing assets in the public folder.
 *
 * @param assetPath - The asset path (e.g., '/Images/logo.svg' or 'Images/logo.svg')
 * @returns The full path to the asset including base path
 *
 * @example
 * // If basePath is '/signoz/'
 * getAssetUrl('/Images/logo.svg') // returns '/signoz/Images/logo.svg'
 * getAssetUrl('Icons/icon.svg')   // returns '/signoz/Icons/icon.svg'
 */
export function getAssetUrl(assetPath: string): string {
	const basePath = getBasePath();
	// Remove leading slash from asset path if present
	const normalizedPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
	return `${basePath}${normalizedPath}`;
}
