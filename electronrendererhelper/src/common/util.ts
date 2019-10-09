/**
 * For type-safe string name lookup of properties/method names.
 * 
 * @internal 
 * @hidden
 */
export const nameof = <T>(name: keyof T) => name;

/**
 * Helper method that returns true if code is running as part of node
 * and not (for example) as part of a browser render process.
 * 
 * @internal 
 * @hidden
 */
export function isNodeJs() {
    return typeof process !== 'undefined' &&
           process.versions != null &&
           process.versions.node != null;
}


/**
 * Helper method that returns true if code is running as part of
 * a browser render process.
 * 
 * @internal 
 * @hidden
 */
export function isBrowser() {
    return typeof window !== 'undefined';
}

/**
 * Internal helper to serialize errors as event data.
 * 
 * @internal 
 * @hidden
 */
export function serializeError(error: Error | undefined | null) : object | undefined | null {
    if (error !== undefined && error !== null) {
      var simpleObject: { [p: string]: any; } = {};
  
      if (error.name) {
          simpleObject["name"] = error.name;
      }
  
      if (error.message) {
          simpleObject["message"] = error.message;
      }
  
      if (error.stack) {
          simpleObject["stack"] = error.stack;
      }
  
      // Copy extra properties not mentioned here.
      Object.getOwnPropertyNames(error).forEach(function(key) {
          if (simpleObject[key]==undefined) {
              simpleObject[key] = (error as any)[key];
          }
      });
  
      return simpleObject;
    } else {
        return error;
    }
  }