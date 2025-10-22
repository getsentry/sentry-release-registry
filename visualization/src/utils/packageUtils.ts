/**
 * Extracts the display name from a canonical package identifier
 * by removing the registry prefix.
 * 
 * @param canonical - The canonical identifier (e.g., "npm:@sentry/react", "pypi:sentry-sdk")
 * @returns The package identifier without the registry prefix (e.g., "@sentry/react", "sentry-sdk")
 * 
 * @example
 * getDisplayName("npm:@sentry/react") // returns "@sentry/react"
 * getDisplayName("pypi:sentry-sdk") // returns "sentry-sdk"
 * getDisplayName("app:sentry-cli") // returns "sentry-cli"
 */
export function getDisplayName(canonical: string): string {
  if (!canonical) {
    return '';
  }
  
  const colonIndex = canonical.indexOf(':');
  if (colonIndex === -1) {
    // No colon found, return the whole string
    return canonical;
  }
  
  // Return everything after the colon
  return canonical.substring(colonIndex + 1);
}

