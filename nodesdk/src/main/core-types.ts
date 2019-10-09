/**
 * This file contains type definitions shared between the public api 
 * and the internal sdk integration.
 */

import { enumDeviceConnectionType, enumSettingCtrlType, enumSettingDataType, enumAPIReturnCode, enumBTPairedListType } from './jabra-enums';

/**
 * The type of error returned from rejected Jabra API promises.
 */
export declare type JabraError = Error & {
    /**
     * Jabra return code from native sdk.
     */
    code?: number 
};

/** 
 * Logging level for logging to the native log.
 * 
 * For internal use only!
 */
export declare const enum AddonLogSeverity
{
        none = 0,
        fatal = 1,
        error = 2,
        warning = 3,
        info = 4,
        debug = 5,
        verbose = 6
};

/** 
 * Native log configuration.
 * 
 * For internal use only!
 */
export declare interface NativeAddonLogConfig
{
    maxSeverity: AddonLogSeverity;
    maxSeverityString: AddonLogSeverity;
    configuredLogPath: string;
};

/**
 * @param blockAllNetworkAccess - if true, all network access is blocked
 * @param baseUrl_capabilities -
 *   // optional. The host and path (up to, but excluding the '?') of the source for capability files. The responding host is responsible for parsing the entire URL with parameters delivered and produce a response that is equivalent to the response from the default Jabra endpoints.
     // see https://devicecapabilities.jabra.com/swagger/ui/index (note: v4)
    // Special cases:
    //     null or "": use the default.
* @param baseUrl_fw -
*   // optional. The host and partial path of the source for FW files. The responding host is responsible for parsing the entire URL with parameters delivered and produce a response that is equivalent to the response from the Jabra endpoints.
    // example: https://firmware.jabra.com/v4
    // See https://firmware.jabra.com/swagger/#/v3 for full URL and parameters
    // Special cases:
    //     null or "": use the default.
* @param proxy - optional. specify the proxy to use. Null or "" if a proxy should not be used. Example: "https://myproxyhost:8042". Supported proxy types, see https://curl.haxx.se/libcurl/c/CURLOPT_PROXY.html
*/
export interface ConfigParamsCloud {
    blockAllNetworkAccess?: boolean,
    baseUrl_capabilities?: string,
    baseUrl_fw?: string,
    proxy?: string,
}

export interface DeviceCatalogueParams {
    preloadZipFile: string,
    delayInSecondsBeforeStartingRefresh: number,
    refreshAtConnect: boolean,
    refreshScope: number,
    fetchDataForUnknownDevicesInTheBackground: boolean,
}

/** 
 * Device information data properties supported by DeviceType
 * and carried between js and native code. 
 * 
 * Nb. Not for general use - Intended for internal use.
 **/
export interface DeviceInfo {
    deviceID: number;
    productID: number;
    vendorID: number;
    deviceName: string;
    usbDevicePath?: string;
    parentInstanceId?: string; // Not currently exposed in js so marked as optional.
    errorStatus: number; // = errStatus in SDK.
    isDongleDevice: boolean; // = isDongle in SDK.
    dongleName?: string;// Not currently exposed in js so marked as optional.
    variant: string;
    ESN: string; // = serialNumber in SDK.
    isInFirmwareUpdateMode: boolean;
    connectionType: enumDeviceConnectionType; // = deviceconnection in SDK.
    connectionId?: number; // Not currently exposed in js so marked as optional.
    parentDeviceId?: number; // Not currently exposed in js so marked as optional.
}

export interface RCCStatus {
    isMuted: boolean,
    isOffHooked: boolean,
    isOnHold: boolean,
    isRinging: boolean
}

export interface ConfigInfo {
    configName: string,
    configId: string
}

export interface FirmwareInfoType {
    version: string;
    fileSize: string;
    releaseDate: string;
    stage: string;
    releaseNotes: string;
}

export interface SettingType {
    guid: string,
    name: string,
    helpText: string,
    cntrlType: enumSettingCtrlType,
    currValue: number | string,
    settingDataType: enumSettingDataType,
    listSize?: number,
    groupName: string,
    groupHelpText: null | undefined | string,
    isPCsetting: boolean,
    isDeviceRestart: boolean,
    isWirelessConnect: boolean,
    isChildDeviceSetting: boolean,
    isDepedentsetting: boolean,
    dependentDefaultValue: null | undefined | number | string,
    isValidationSupport: boolean,
    validationRule: null | undefined | { minLength: number, maxLength: number, regExp: string, errorMessage: string },
    listKeyValue: Array<{ key: number, value: string, dependentcount?: number, dependents: Array<{ GUID: string, enableFlag: boolean }> }>
}

export interface DeviceSettings {
  errStatus?: enumAPIReturnCode;
  settingInfo: Array<SettingType>;
};

export interface PairedListInfo  { 
    listType: enumBTPairedListType;
    pairedDevice: Array<{ deviceName: string, deviceBTAddr: string, isConnected: boolean }>;
};

export interface NamedAsset {
    elements: Array<{url: string, mime: string}>;
    metadata: Array<{name: string, value: string}>
}
