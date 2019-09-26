/**
 * For type-safe string name lookup of properties/method names.
 */
export const nameof = <T>(name: keyof T) => name;

/**
 * Helper method that returns true if code is running as part of node
 * and not (for example) as part of a browser render process.
 */
export function isNodeJs() {
    return typeof process !== 'undefined' &&
           process.versions != null &&
           process.versions.node != null;
}


/**
 * Helper method that returns true if code is running as part of
 * a browser render process.
 */
export function isBrowser() {
    return typeof window !== 'undefined';
}