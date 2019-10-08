import { SdkIntegration } from "./sdkintegration";
import { AddonLogSeverity } from "./core-types";
import { isNodeJs } from './util';

/** @internal */
let sdkIntegration: SdkIntegration;

// @ts-ignore
if (isNodeJs()) {
    // These statements should be executed under nodejs only to avoid browserfy problems:    
    let bindings = require('bindings');
    sdkIntegration = bindings('sdkintegration');
} 

/**
 * Add a message to native Jabra SDK log file.
 * 
 * This function is for internal only use by helpers and tests (Refer to sdkIntegration
 * comments for details).
 * 
 * Nb. The method is does not throw exceptions even on failure. So it ought to be safe to call in any context.
 * 
 * @hidden
 */
export function _JabraNativeAddonLog(severity: AddonLogSeverity, caller: string, msg: string | Error): void {
    try {
      return sdkIntegration.NativeAddonLog(severity, caller, msg);
    } catch (e) { // Make sure any exceptions does not propagate.
        // If the console is up, let 
        console.error("Could not add error to Jabra native log. Got error " + e);
    }
}