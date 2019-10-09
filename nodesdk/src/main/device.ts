import { SdkIntegration } from "./sdkintegration";
import { AddonLogSeverity, DeviceTiming } from "./core-types";
import { isNodeJs } from './util';

// Browser friendly type-only import:
type _EventEmitter = import('events').EventEmitter;

/** @internal */
let sdkIntegration: SdkIntegration;

/** @internal */
let events: any;

// @ts-ignore
if (isNodeJs()) { 
    // These statements should be executed under nodejs only to avoid browserfy problems:
    
    let bindings = require('bindings');
    sdkIntegration = bindings('sdkintegration');

    events = require('events');
} 

import { DeviceInfo, RCCStatus, ConfigInfo, ConfigParamsCloud, DeviceCatalogueParams,
    FirmwareInfoType, SettingType, DeviceSettings, PairedListInfo, NamedAsset } from './core-types';

import { enumAPIReturnCode, enumDeviceErrorStatus, enumDeviceBtnType, enumDeviceConnectionType,
    enumSettingDataType, enumSettingCtrlType, enumSettingLoadMode, enumFirmwareEventStatus,
    enumFirmwareEventType, enumBTPairedListType, enumUploadEventStatus, audioFileFormat,
    enumDeviceFeature, enumHidState, enumWizardMode, enumLogging } from './jabra-enums';
import * as _jabraEnums from './jabra-enums';

import { MetaApi, ClassEntry, _getJabraApiMetaSync } from './meta';

import * as util from 'util';
import { throws } from "assert";

export namespace DeviceTypeCallbacks {
    export type btnPress = (btnType: enumDeviceBtnType, value: boolean) => void;
    export type busyLightChange = (status: boolean) => void;
    export type downloadFirmwareProgress = (type: enumFirmwareEventType, status: enumFirmwareEventStatus, dwnldStatusInPrcntg: number) => void;
    export type onBTParingListChange = (pairedListInfo: PairedListInfo) => void;
    export type onGNPBtnEvent = (btnEvents: Array<{ buttonTypeKey: number, buttonTypeValue: string, buttonEventType: Array<{ key: number, value: string }> }>) => void;
    export type onDevLogEvent = (eventString: string) => void;
    export type onBatteryStatusUpdate = (levelInPercent: number, isCharging: boolean, isBatteryLow: boolean) => void;
    export type onUploadProgress = (status: enumUploadEventStatus, levelInPercent: number) => void;
}

export type DeviceTypeEvents = 'btnPress' | 'busyLightChange' | 'downloadFirmwareProgress' | 'onBTParingListChange' | 'onGNPBtnEvent' | 'onDevLogEvent' | 'onBatteryStatusUpdate' | 'onUploadProgress';

export const DeviceEventsList : DeviceTypeEvents[] = ['btnPress', 'busyLightChange', 'downloadFirmwareProgress', 'onBTParingListChange', 'onGNPBtnEvent', 'onDevLogEvent', 'onBatteryStatusUpdate', 'onUploadProgress'];

/** 
 * Represents a concrete Jabra device and the operations that can be done on it.   
 */
export class DeviceType implements DeviceInfo, DeviceTiming, MetaApi {
    /** 
    * @internal 
    * @hidden
    */
    readonly _eventEmitter: _EventEmitter;

    /** 
     * @internal 
     * @hidden
     **/
    constructor(deviceInfo: DeviceInfo | DeviceType, attached_time_ms: number) {
        if (!isNodeJs()) {
            throw new Error("This JabraType constructor() function needs to run under NodeJs and not in a browser");
        }
        
        this._eventEmitter = new events.EventEmitter();

        this.deviceID = deviceInfo.deviceID;
        this.deviceName = deviceInfo.deviceName;
        this.productID = deviceInfo.productID;
        this.ESN = deviceInfo.ESN;
        this.vendorID = deviceInfo.vendorID;
        this.variant = deviceInfo.variant;
        this.connectionType = deviceInfo.connectionType;
        this.errorStatus = deviceInfo.errorStatus;
        this.isDongleDevice = deviceInfo.isDongleDevice;
        this.isInFirmwareUpdateMode = deviceInfo.isInFirmwareUpdateMode;
        this.attached_time_ms = attached_time_ms;
        this.detached_time_ms = undefined;
    }

    readonly ESN: string;
    readonly connectionType: enumDeviceConnectionType;
    readonly deviceID: number;
    readonly deviceName: string;
    readonly errorStatus: enumDeviceErrorStatus;
    readonly isDongleDevice: boolean;
    readonly isInFirmwareUpdateMode: boolean;
    readonly productID: number;
    readonly vendorID: number;
    readonly variant: string;

    /**
     * The time since EPOC that the device was attached.
     */
    readonly attached_time_ms: number;

    /**
     * The time since EPOC that the device was subsequently detached (if no longer attached only).
     * 
     */
    readonly detached_time_ms?: number;

    //CallControl
    /**
     * Checks for OffHook command support by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if supported, otherwise `false`.
     */
    isOffHookSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsOffHookSupported)(this.deviceID);
    }
    /**
     * Checks for Mute command support by the device (Async).
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if supported, otherwise `false`.
     */
    isMuteSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsMuteSupported)(this.deviceID);

    }

    /**
     * Checks for Ringer command support by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if supported, otherwise `false`.
     */
    isRingerSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsRingerSupported)(this.deviceID);
    }

    /**
     * Checks for Hold support by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if supported, otherwise `false`.
     */
    isHoldSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsHoldSupported)(this.deviceID);
    }

    /**
     * Checks for Online mode support by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if supported, otherwise `false`.
     */
    isOnlineSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsOnlineSupported)(this.deviceID);
    }

    /**
     * Checks if busylight is supported by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if supported, otherwise `false`.
     */
    isBusyLightSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsBusyLightSupported)(this.deviceID);
    }

    /**
     * Set device's offhook state to true (Async).
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    offhookAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetOffHook)(this.deviceID, true);
    }

     /**
     * Set device's offhook state to false.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    onhookAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetOffHook)(this.deviceID, false);
    }

    /**
     * Set device's mute state to true i.e., device gets muted.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    muteAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetMute)(this.deviceID, true);
    }

     /**
     * Set device's mute state to false i.e., device gets unmuted.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    unmuteAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetMute)(this.deviceID, false);
    }

    /**
     * Set device's ringer state to true.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    ringAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetRinger)(this.deviceID, true);
    }

    /**
     * Set device's ringer state to false.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    unringAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetRinger)(this.deviceID, false);
    }

    /**
     * Set device's hold state to true.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    holdAsync(): Promise<void> {
       return util.promisify(sdkIntegration.SetHold)(this.deviceID, true);
    }

    /**
     * Set device's hold state to false.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    resumeAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetHold)(this.deviceID, false);
    }

    /**
     * It opens radio link between base/dongle and device.
     * @param {boolean} audiolink - Boolean value to set Online On/Off
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
    
     */
    setOnlineAsync(audiolink: boolean): Promise<void> {
        return util.promisify(sdkIntegration.SetOnline)(this.deviceID, true);
    }

    /**
     * Set busylight status (Async).
     * @param {boolean} status - Boolean value to set busylight on/off.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setBusyLightStatusAsync(status: boolean): Promise<void> {
        return util.promisify(sdkIntegration.SetBusyLightStatus)(this.deviceID, status);
    }

    getBusyLightStatusAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.GetBusyLightStatus)(this.deviceID);
    }

    /**
     * Get serial number.
     * @returns {string, Error} - Resolve `string` if successful otherwise Reject with `error`.
     
     */
    getSerialNumberAsync(): Promise<string> {
        return this.ESN ? Promise.resolve(this.ESN) : Promise.reject(new Error("No serial number"));
    }

    /**
     * Get ESN (electronic serial number).
     */
    getESNAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetESN)(this.deviceID);
    }

    /**
     * Get asset with name.
     * @returns {NamedAsset, Error} - Resolve `NamedAsset` if successful otherwise Reject with `error`.
     */
    getNamedAssetAsyngetNamec(assetName: string): Promise<NamedAsset> {
        return util.promisify(sdkIntegration.GetNamedAsset)(this.deviceID, assetName);
    }

    /**
     * Get battery status, if supported by device.
     * @returns {Promise<BatteryInfo, Error>} -- Resolve batteryInfo `object` if successful otherwise Reject with `error`.
    
     */
    getBatteryStatusAsync(): Promise<{ levelInPercent?: number, isCharging?: boolean, isBatteryLow?: boolean }> {
        return util.promisify(sdkIntegration.GetBatteryStatus)(this.deviceID);
    }

    /**
     * Gets  the device image path.
     * @returns {Promise<string, Error>} - Resolve imagePath `string` if successful otherwise Reject with `error`.
   
     */
    getImagePathAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetDeviceImagePath)(this.deviceID);
    }

    /**
     * Gets  the device image thumbnail path.
     * @returns {Promise<string, Error>} - Resolve imagePath `string` if successful otherwise Reject with `error`.
     */
    getImageThumbnailPathAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetDeviceImageThumbnailPath)(this.deviceID);
    }

    /**
     * Check if battery is supported.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     */
    isBatterySupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsBatteryStatusSupported)(this.deviceID);
    }

    /**
     * Is logging enabled on device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     */
    isDevLogEnabledAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsDevLogEnabled)(this.deviceID);
    }

    /**
     * Enable/disable logging for a device.
     * @param {boolean} enable - whether to enable device log.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    enableDevLogAsync(enable: boolean): Promise<void> {
        return util.promisify(sdkIntegration.EnableDevLog)(this.deviceID, enable);
    }

    // settings APIs
    /**
     * Gets the complete settings details (all groups and its settings) for a device.
     * @returns {Promise<Array<Setting>, Error>}  - Resolve setting `array` if successful otherwise Reject with `error`.
     */
    getSettingsAsync(): Promise<DeviceSettings> {
        return util.promisify(sdkIntegration.GetSettings)(this.deviceID);
    }

    /**
     * Gets the unique setting identified by a GUID of a device.
     * @param {string} guid - the unique setting identifier.
     * @returns {Promise<Array<Setting>, Error>}  - Resolve setting `array` if successful otherwise Reject with `error`.
     */
    getSettingAsync(guid: string): Promise<DeviceSettings> {
        return util.promisify(sdkIntegration.GetSetting)(this.deviceID, guid);
    }

    /**
     * Sets all the settings( including all groups and its settings) for a device.
     * @param {Array<Setting>} settings - pass only changed setting
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setSettingsAsync(settings: DeviceSettings): Promise<void> {
        return util.promisify(sdkIntegration.SetSettings)(this.deviceID, settings);
    }
    /**
     * Restore factory settings to device.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    resetSettingsAsync(): Promise<void> {
        return util.promisify(sdkIntegration.FactoryReset)(this.deviceID);
    }

    /**
     * Checks if supports factory reset.
     * @returns {Promise<boolean>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * `true` if device supports factory reset, `false` if device does not support factory reset.
     */
    isFactoryResetSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsFactoryResetSupported)(this.deviceID);
    }
       
    /**
     * Returns error description for the error code
     * @returns {Prmoise<Array<string>, Error>} - Resolve failedSetting `array` if successful otherwise Reject with `error`.
     * - return FailedSettings if one or more settings are failed while writing to device.
     * - return empty array if all settings are written successfully.
     * - **Note**: This API should be called if setSettings does not return Return_Ok.
     */
    getFailedSettingNamesAsync(): Promise<Array<string>>{
        return util.promisify(sdkIntegration.GetFailedSettingNames)(this.deviceID);
    }

    // firmware APIs

    /**
     * Get firmware version of the device.
     * @returns {Promise<string, Error>} - Resolve version `string` if successful otherwise Reject with `error`.
     */
    getFirmwareVersionAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetFirmwareVersion)(this.deviceID);
    }

    /**
     * Gets details of the latest firmware present in cloud.
     * @param {string} [authorization] - Authorization Id.
     * @returns {Promise<FirmwareInfo, Error>} - Resolve firminfo `object` if successful otherwise Reject with `error`.
     */
    getLatestFirmwareInformationAsync(authorization?: string): Promise<FirmwareInfoType> {
        return util.promisify(sdkIntegration.GetLatestFirmwareInformation)(this.deviceID, authorization || "");
    }
    /**
     * Check if Firmware update available for device.
     * @param {string} [authorization] - authorizationId
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - `true` - if firmware uptodate, `flase` - if firmware is not uptodate.
     */
    checkForFirmwareUpdateAsync(authorization: string): Promise<boolean> {
        return util.promisify(sdkIntegration.CheckForFirmwareUpdate)(this.deviceID, authorization || "");
    }
    /**
     * Downloads the specified firmware version file.
     * @param {string} version - Version for which file download needs to be initiated.
     * @param {string} [authorization] - Authorization Id.
     * @returns {Promise<string|null, Error>} - Resolve dwnldPath `string|null` if successful otherwise Reject with `error`.   
     */
    downloadFirmwareAsync(version: string, authorization?: string): Promise<void | null> {
        return util.promisify(sdkIntegration.DownloadFirmware)(this.deviceID, version, authorization || "");
    }

    /**
     * @brief Get the file path of the downloaded file.
     * @param[in] deviceID ID for specific device.
     * @param[in] version Version for which the path is required.
     * @return firmwareFilePath firmware file path of the device.
     * @note Call #Jabra_DownloadFirmware first to ensure that data is current
     * @note As memory is allocated through SDK for firmwareFilePath, it must be
     * freed by calling, memory needs to be freed by calling #Jabra_FreeString.
     * @see Jabra_IsFirmwareLockEnabled
     * @see Jabra_CheckForFirmwareUpdate
     * @see Jabra_GetLatestFirmwareInformation
     * @see Jabra_FreeFirmwareInfo
     * @see Jabra_GetAllFirmwareInformation
     * @see Jabra_FreeFirmwareInfoList
     * @see Jabra_DownloadFirmware
     * @see Jabra_DownloadFirmwareUpdater
     * @see Jabra_UpdateFirmware
     * @see Jabra_CancelFirmwareDownload
     * @see Jabra_RegisterFirmwareProgressCallBack
     */
    getFirmwareFilePathAsync(version: string): Promise<string | null> {
        return util.promisify(sdkIntegration.GetFirmwareFilePath)(this.deviceID, version);
    }

    /**
     * Cancels the firmware download (Async).
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    cancelFirmwareDownloadAsync(): Promise<void> {
        return util.promisify(sdkIntegration.CancelFirmwareDownload)(this.deviceID);
    }
    /**
     * Upgrades/Updates the firmware for the target device with specified version.
     * @param {string} firmwareFilePath - firmware file path.
     * @returns {Promise<undefined, Error>} Resolve `undefined` if successful otherwise Reject with `error`.  
     */
    updateFirmwareAsync(firmwareFilePath: string): Promise<string | null> {
        return util.promisify(sdkIntegration.UpdateFirmware)(this.deviceID, firmwareFilePath);
    }
    /**
     * Get the detailed error response for the last firmware update action performed(Check for firmware update/ Get the firmware info list/ download firmware).
     * @returns {Promise<{errorExceptionType: string, errorMessage: string, errorDetails: string}, Error>}  - Resolve errDetail `object|null` if successful otherwise Reject with `error`.
     */
    getLastFirmwareUpdateErrorInfoAsync(): Promise<{ errorExceptionType: string, errorMessage: string, errorDetails: string } | null> {
        return util.promisify(sdkIntegration.GetLastFirmwareUpdateErrorInfo)(this.deviceID);
    }

    // bluetooth APIs
    /**
     * Set the bluetooth device in pairing mode.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setBTPairingAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SetBTPairing)(this.deviceID);
    }
    /**
     * Stop search for available Bluetooth devices.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    stopBTPairingAsync(): Promise<void> {
        return util.promisify(sdkIntegration.StopBTPairing)(this.deviceID);
    }
    
    /**
     * Search for available Bluetooth devices which are switched on, within range and ready to connect.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    searchNewDevicesAsync(): Promise<void> {
        return util.promisify(sdkIntegration.SearchNewDevices)(this.deviceID);
    }
    /**
     * Connect/Reconnect Bluetooth device to the Jabra Bluetooth adapter. Ensure the Bluetooth device is switched on and within range.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    connectBTDeviceAsync(): Promise<void> {
        return util.promisify(sdkIntegration.ConnectBTDevice)(this.deviceID);
    }
    /**
     * Connect a new device.
     * @param {string} deviceName - name of device to be connected.
     * @param {string} deviceBTAddr -  BTAddress of device to be connected.
     * @param {boolean} isConnected - current status of device to be connected.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
    */
    connectNewDeviceAsync(deviceName: string, deviceBTAddr: string, isConnected: boolean): Promise<void> {
        return util.promisify(sdkIntegration.ConnectNewDevice)(this.deviceID, deviceName, deviceBTAddr, isConnected);
    }
    /**
     * Connect a device which was already paired.
     * @param {string} deviceName - name of device to be connected.
     * @param {string} deviceBTAddr -  BTAddress of device to be connected.
     * @param {boolean} isConnected - current status of device to be connected.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     * - **Note**       : After device connection, Jabra_GetPairingList api has to be called to get updated connection status.
     */
    connectPairedDeviceAsync(deviceName: string, deviceBTAddr: string, isConnected: boolean): Promise<void> {
        return util.promisify(sdkIntegration.ConnectPairedDevice)(this.deviceID, deviceName, deviceBTAddr, isConnected);
    }

    /**
     * Disconnect  Bluetooth device from  Bluetooth adapter.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    disconnectBTDeviceAsync(): Promise<void> {
        return util.promisify(sdkIntegration.DisconnectBTDevice)(this.deviceID);
    }

    /**
     * Disconnect a paired device.
     * @param {string} deviceName - name of device to be disconnected.
     * @param {string} deviceBTAddr -  BTAddress of device to be disconnected.
     * @param {boolean} isConnected - current status of device to be disconnected.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     * - **Note**       : After device disconnection, Jabra_GetPairingList api has to be called to get updated connection status.
     */
    disconnectPairedDeviceAsync(deviceName: string, deviceBTAddr: string, isConnected: boolean): Promise<void> {
        return util.promisify(sdkIntegration.DisconnectPairedDevice)(this.deviceID, deviceName, deviceBTAddr, isConnected)
    }

    /**
     * When Bluetooth adapter is plugged into the PC it will attempt to connect with the last connected Bluetooth device. If it cannot connect, it will automatically search for new Bluetooth devices to connect to.
     * @param {boolean} value - enable or disable for auto pairing.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setAutoPairingAsync(value: boolean): Promise<void> {
        return util.promisify(sdkIntegration.SetAutoPairing)(this.deviceID, value);
    }

    /**
     * Get Auto pairing mode enable or disable.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - `true` if auto pairing mode is enabled, `false` otherwise.
     */
    getAutoPairingAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.GetAutoPairing)(this.deviceID);
    }

    /**
     * Checks if pairing list is supported by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - true if pairing list is supported, false if device does not support pairing list.
     */
    isPairingListSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsPairingListSupported)(this.deviceID);
    }

    /**
     * Gets the list of devices which are paired previously.
     * @returns { Promise<Array<PairedDevice>, Error>} - Resolve pairList `array` if successful otherwise Reject with `error`.
     */
    getPairingListAsync(): Promise<Array<{ deviceName: string, deviceBTAddr: string, isConnected: boolean }>> {
        return util.promisify(sdkIntegration.GetPairingList)(this.deviceID);
    }

    /**
     * Clear list of paired BT devices from BT adaptor.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    clearPairingListAsync(): Promise<void> {
        return util.promisify(sdkIntegration.ClearPairingList)(this.deviceID);
    }

    /**
     * Get name of connected BT device with BT Adapter(Async).
     * @returns {Promise<string, Error>} - Resolve deviceName `string` if successful otherwise Reject with `error`.
     */
    getConnectedBTDeviceNameAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetConnectedBTDeviceName)(this.deviceID);
    }

    /**
     * Gets the list of new devices which are available to pair & connect.
     * @returns { Promise<Array<PairedDevice>, Error>} - Resolve pairList `array` if successful otherwise Reject with `error`.
     * - **Note**: `isConnected`, flag in Jabra_PairingList, will always be false as device does not give connection status for the found device.
     */
    getSearchDeviceListAsync(): Promise<Array<{ deviceName: string, deviceBTAddr: string, isConnected: boolean }>> {
	 return util.promisify(sdkIntegration.GetSearchDeviceList)(this.deviceID);
    }

    //RMMI APIs
    /**
     * Gets the supported remote MMI for a device.
     * @returns {Promise<Array<ButtonEvent>, Error>} - Resolve btnEvent `object` if successful otherwise Reject with `error`.
     */
    getSupportedButtonEventsAsync(): Promise<Array<{ buttonTypeKey: number, buttonTypeValue: string, buttonEventType: Array<{ key: number, value: string }> }>> {
        return util.promisify(sdkIntegration.GetSupportedButtonEvents)(this.deviceID);
    }

    /**
     * Configures the remote MMI events for a device.
     * @param {Array<{buttonTypeKey: number, buttonTypeValue: string, buttonEventType: Array<{key: number, value: string}>}>} btnEvents
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    getButtonFocusAsync(btnEvents: Array<{ buttonTypeKey: number, buttonTypeValue: string, buttonEventType: Array<{ key: number, value: string }> }>): Promise<void> {
        return util.promisify(sdkIntegration.GetButtonFocus)(this.deviceID, btnEvents);    
    }

    /**
     * Releases the remote MMI events configured in the device.
     * @param {Array<{buttonTypeKey: number, buttonTypeValue: string, buttonEventType: Array<{key: number, value: string}>}>} btnEvents
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    releaseButtonFocusAsync(btnEvents: Array<{ buttonTypeKey: number, buttonTypeValue: string, buttonEventType: Array<{ key: number, value: string }> }>): Promise<void> {
        return util.promisify(sdkIntegration.ReleaseButtonFocus)(this.deviceID, btnEvents);
    }        

    /**
     * Checks if Upload Ringtone to the device is supported by the device.
     * @returns {Promise<boolean>, Error} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - return `true` if Upload Ringtone to the device is supported, `false` if device does not support the ringtone upload to the device.
     */
    isUploadRingtoneSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsUploadRingtoneSupported)(this.deviceID);
    }

    /**
     * Upload ringtone to device  (Async).
     * @param {string} fileName
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    uploadRingtoneAsync(fileName: string): Promise<void> {
        return util.promisify(sdkIntegration.UploadRingtone)(this.deviceID, fileName);
    }

    /**
     * Get details of audio file for uploading to device.
     * @returns {Promise<AudioFileParams, Error>} - Resolve audioFileDetail `object` if successful otherwise Reject with `error`.
     */
    getAudioFileParametersForUploadAsync(): Promise<{ audioFileType: number, numChannels: number, bitsPerSample: number, sampleRate: number, maxFileSize: number }> {
        return util.promisify(sdkIntegration.GetAudioFileParametersForUpload)(this.deviceID);
    }

    /**
     * Upload ringtone to device in .wav format.
     * @param {string} fileName
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    uploadWavRingtoneAsync(fileName: string): Promise<void> {
        return util.promisify(sdkIntegration.UploadWavRingtone)(this.deviceID, fileName);
    }

    /**
     * Feature of configuring time to device (Async).
     * @param {DateTimeParam} timedate  -date and time in object format
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setDateTimeAsync(timedate: { sec: number, min: number, hour: number, mday: number, mon: number, year: number, wday: number }): Promise<void> {
       return util.promisify(sdkIntegration.SetDatetime)(this.deviceID, timedate);
    }

    /**
     * Checks if date and time can be configured to device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`. 
     * - `true` if configuring time for device is supported, `false` if device does not support date and time configuration.
     */
    isSetDateTimeSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsSetDateTimeSupported)(this.deviceID);
    }

    /**
     * Checks if image upload is supported by the device.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`. 
     * - `true` if device supports image upload otherwise `false`.
     */
    isUploadImageSupportedAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsUploadImageSupported)(this.deviceID);
    }

    /**
     * Upload image to device.
     * @param {string} fileName name of image file to be uploaded.
     * @return {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`. 
     */
    uploadImageAsync(fileName: string): Promise<void> {
        return util.promisify(sdkIntegration.UploadImage)(this.deviceID, fileName);
    }

    /**
     * Checks if setting protection is enabled.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - return `true` if setting protection is enabled otherwise `false`.
     */
    isSettingProtectionEnabledAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsSettingProtectionEnabled)(this.deviceID);
    }

    /**  
     * Get the panic list.
     * @returns {Promise<Array<string>, Error>} Resolve paniclist 'array' if successful otherwise Reject with `error`.
     * - panic code will be hex string
     */
    getPanicsAsync(): Promise<Array<string>> {
        return util.promisify(sdkIntegration.GetPanics)(this.deviceID);
    }

    /**
     * Check if a feature is supported by a device.
     *  @param {number} deviceFeature - the feature to check, should be `enumDeviceFeature`
     *  @returns {Promise<boolean, Error>} isfeatureSupports, if successful otherwise Reject with `error`.
     */
    isFeatureSupportedAsync(deviceFeature: number): Promise<boolean> {
        return util.promisify(sdkIntegration.IsFeatureSupported)(this.deviceID,deviceFeature);
    }

    /**
     * Check if GN or Std HID state is supported by a device.
     *  @returns {Promise<boolean, Error>} isGnHidStdHidSupported, if successful otherwise Reject with `error`.
     */
    isGnHidStdHidSupportedAsync(): Promise<boolean>  {
        return util.promisify(sdkIntegration.IsGnHidStdHidSupported)(this.deviceID);
    }

    /**
     * Get array of features supported by a device
     * @returns { Promise<Array<enumDeviceFeature>, Error>} array of supported features, should be `enumDeviceFeature`, if successful otherwise Reject with `error`.
     */
    getSupportedFeaturesAsync(): Promise<Array<enumDeviceFeature>> {
         return util.promisify(sdkIntegration.GetSupportedFeatures)(this.deviceID);
    }
     
    /**
     * Sets the HID working state to either standard HID (usb.org HID specification) or GN HID.
     * @param {number} hidState - state HID working state (`enumHidState`)
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setHidWorkingStateAsync(hidState: enumHidState): Promise<void>  {
        return util.promisify(sdkIntegration.SetHidWorkingState)(this.deviceID, hidState);
    }

    /**
     * Gets the HID working state.
     * @returns {Promise<number, Error>} - Resolve hidState (`enumHidState`) if successful otherwise Reject with `error`.
     */
    getHidWorkingStateAsync() : Promise<enumHidState>  {
        return util.promisify(sdkIntegration.GetHidWorkingState)(this.deviceID);
    }

    /**
     * @brief Sets the wizard mode (whether a full setup wizard, a limited setup
     * wizard or none will run on next power-on). Use #Jabra_IsFeatureSupported
     * to query feature support #DeviceFeature.FullWizardMode or
     * #DeviceFeature.LimitedWizardMode.
     * @param {number} wizardMode Wizard mode to be set (one of WizardModes).
     * @return Return_Ok if the wizard mode was set successfully.
     * @return Return_ParameterFail if the input parameter fails to comply.
     * @return Device_WriteFail if the write request was rejected.
     * @return Device_Unknown if the device is not known.
     */
    setWizardModeAsync(wizardMode: enumWizardMode) : Promise<void>  {
       return util.promisify(sdkIntegration.SetWizardMode)(this.deviceID,wizardMode);
    }

    /**
    * @brief Reads the current wizard mode (whether a full setup wizard, a limited
    * setup wizard or none will run on next power-on). Use
    * #Jabra_IsFeatureSupported to query feature support
    * #DeviceFeature.FullWizardMode or #DeviceFeature.LimitedWizardMode.
    * @param {number} wizardMode Current wizard mode (one of WizardModes).
    * @return Return_Ok if the current wizard mode was retrieved successfully.
    * @return Not_Supported if the functionality is not supported.
    * @return Device_Unknown id the device is not known.
    */ 
    getWizardModeAsync() : Promise<enumWizardMode>  {

       return util.promisify(sdkIntegration.GetWizardMode)(this.deviceID);
    }

     /**
     * Clear a device from paired device list.
     * @param {string} deviceName - name of device to be connected.
     * @param {string} deviceBTAddr -  BTAddress of device to be connected.
     * @param {boolean} isConnected - current status of device to be connected.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    clearPairedDeviceAsync(deviceName: string, deviceBTAddr: string, isConnected: boolean): Promise<void>  {
        return util.promisify(sdkIntegration.ClearPairedDevice)(this.deviceID, deviceName, deviceBTAddr, isConnected);
    }

    /**
     * Downloads the latest FW updater relevant for this device
     * @param {string} [authorization] - Authorization Id.
     * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
     */
    downloadFirmwareUpdaterAsync(authorization?: string): Promise<void | null>  {
        return util.promisify(sdkIntegration.DownloadFirmwareUpdater)(this.deviceID, authorization || "");
    }
    
    /**
     * Sets a static timestamp in the device. Can be used for later referencing using Jabra_GetTime.
     * @param{Number} : newTime: Timestamp to be set. Unix epoch.
     * @return{Promise<undefined, Error>} : Resolve `undefined` if successful otherwise Reject with `error`.
     */
    setTimestampAsync(timeStamp: number) : Promise<void>  {
        return util.promisify(sdkIntegration.SetTimestamp)(this.deviceID, timeStamp);
    }
    
    /**
     * Gets the static timestamp in the device.
     * @return{Promise<Date, Error>} :Resolve `Date` if successful otherwise Reject with `error`.
     */
    getTimestampAsync() : Promise<Number>  {
        return util.promisify(sdkIntegration.GetTimestamp)(this.deviceID);
    }

    /**
    * Play Ringtone in Device.
    * @param {number} level volume Level to Play.
    * @param {number} type ringtone Type to Play.
    * @returns {Promise<undefined, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
    */
    playRingtoneAsync(level: number, type: number): Promise<void>  {
        return util.promisify(sdkIntegration.PlayRingTone)(this.deviceID,level,type);
    }

    /**
    * Checks if equalizer is supported by the device.
    * @returns {Promise<boolean, Error>} Resolve True if equalizer is supported, false if device does not support
    * equalizer otherwise Reject with `error`.
    */
   isEqualizerSupportedAsync(): Promise<boolean>  {
    return util.promisify(sdkIntegration.IsEqualizerSupported)(this.deviceID);
   }
    
   /**
   * Checks if equalizer is enabled.
   * @returns {Promise<boolean, Error>} Resolve True if equalizer is enabled, false if equalizer is disabled or not
   * supported by the device otherwise Reject with `error`.
   */
   isEqualizerEnabledAsync(): Promise<boolean>  {
    return util.promisify(sdkIntegration.IsEqualizerSupported)(this.deviceID);
   }

   /**
   * Enable/disable equalizer.
   * @param {boolean} enable Enable or disable equalizer.
   * @returns {Promise<undefined, Error>} Resolve `undefined` if successful otherwise Reject with `error`.
   */
   enableEqualizerAsync(enable: boolean): Promise<void> {
    return util.promisify(sdkIntegration.EnableEqualizer)(this.deviceID, true);
   }

   /**
   * Get equalizer parameters.
   * @param {number} maxBands Max no of bands to return (default is 5)
   * @returns {Promise<Array<EqualizerBand>, Error>} - Resolve equalizerBand `object` if successful otherwise Reject with `error`.
   */
   getEqualizerParametersAsync(maxNBands?: number): Promise<Array<{ max_gain: number, centerFrequency: number, currentGain: number }>> {
     return util.promisify(sdkIntegration.GetEqualizerParameters)(this.deviceID, maxNBands || 5);
   }

   /**
    * Set equalizer parameters
    * @param {Array<number>} bands Caller-owned array containing the band gains to set in dB
    * (must be within range of +/- max_gain).
    * @returns {Promise<void>, Error>} - Resolve `undefined` if successful otherwise Reject with `error`.
   */
   setEqualizerParametersAsync(bands: Array<number>, nband:number): Promise<void> {
    return util.promisify(sdkIntegration.SetEqualizerParameters)(this.deviceID, bands, nband);
   }

    /**
     * Checks if firmware lock is enabled. If the firmware lock is enabled
     * it is not possible to upgrade nor downgrade the firmware. In this situation
     * the firmware can only be changed to the same version e.g. if you want to
     * change the language.
     *  @returns {Promise<boolean, Error>} isFirmwareLockEnabled, if successful otherwise Reject with `error`.
     */
   isFirmwareLockEnabledAsync(): Promise<boolean> {
    return util.promisify(sdkIntegration.IsFirmwareLockEnabled)(this.deviceID);
   }

   /**
   * Get meta information about methods, properties etc. that can be used 
   * for reflective usage of this class.
   */
   getMeta() : ClassEntry {
      const deviceClassName = this.constructor.name;
      const apiMeta = _getJabraApiMetaSync();
      let deviceTypeMeta = apiMeta.find((c) => c.name === deviceClassName);
      if (!deviceTypeMeta)
         throw new Error("Could not find meta data for " + deviceClassName);
      return deviceTypeMeta;
   }

   /**
   * Add event handler for btnPress device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'btnPress', listener: DeviceTypeCallbacks.btnPress): this;

   /**
   * Add event handler for busyLightChange device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */   
   on(event: 'busyLightChange', listener: DeviceTypeCallbacks.busyLightChange): this;
      
   /**
   * Add event handler for downloadFirmwareProgress device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'downloadFirmwareProgress', listener: DeviceTypeCallbacks.downloadFirmwareProgress): this;
      
   /**
   * Add event handler for onBTParingListChange device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'onBTParingListChange', listener: DeviceTypeCallbacks.onBTParingListChange): this;
      
   /**
   * Add event handler for onGNPBtnEvent device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'onGNPBtnEvent', listener: DeviceTypeCallbacks.onGNPBtnEvent): this;
      
   /**
   * Add event handler for onDevLogEvent device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'onDevLogEvent', listener: DeviceTypeCallbacks.onDevLogEvent): this;
         
   /**
   * Add event handler for onBatteryStatusUpdate device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'onBatteryStatusUpdate', listener: DeviceTypeCallbacks.onBatteryStatusUpdate): this;
      
   /**
   * Add event handler for onUploadProgress device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   on(event: 'onUploadProgress', listener: DeviceTypeCallbacks.onUploadProgress): this;

    /**
     * Add event handler for one of the different device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
   on(event: DeviceTypeEvents,
      listener: DeviceTypeCallbacks.btnPress | DeviceTypeCallbacks.busyLightChange | DeviceTypeCallbacks.downloadFirmwareProgress | DeviceTypeCallbacks.onBTParingListChange |
                DeviceTypeCallbacks.onGNPBtnEvent | DeviceTypeCallbacks.onDevLogEvent | DeviceTypeCallbacks.onBatteryStatusUpdate | DeviceTypeCallbacks.onUploadProgress): this {

      this._eventEmitter.on(event, listener);

      return this;
   }

   /**
   * Remove event handler for previosly setup btnPress device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'btnPress', listener: DeviceTypeCallbacks.btnPress): this;
   
   /**
   * Remove event handler for previosly setup busyLightChange device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'busyLightChange', listener: DeviceTypeCallbacks.busyLightChange): this;
   
   /**
   * Remove event handler for previosly setup downloadFirmwareProgress device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'downloadFirmwareProgress', listener: DeviceTypeCallbacks.downloadFirmwareProgress): this;
   
   /**
   * Remove event handler for previosly setup onBTParingListChange device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'onBTParingListChange', listener: DeviceTypeCallbacks.onBTParingListChange): this;
   
   /**
   * Remove event handler for previosly setup onGNPBtnEvent device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'onGNPBtnEvent', listener: DeviceTypeCallbacks.onGNPBtnEvent): this;
   
   /**
   * Remove event handler for previosly setup onDevLogEvent device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'onDevLogEvent', listener: DeviceTypeCallbacks.onDevLogEvent): this;
   
   /**
   * Remove event handler for previosly setup onBatteryStatusUpdate device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'onBatteryStatusUpdate', listener: DeviceTypeCallbacks.onBatteryStatusUpdate): this;
   
   /**
   * Remove event handler for previosly setup onUploadProgress device events.
   * 
   * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
   */
   off(event: 'onUploadProgress', listener: DeviceTypeCallbacks.onUploadProgress): this;

    /**
     * Remove previosly setup event handler for device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
   off(event: DeviceTypeEvents,
      listener: DeviceTypeCallbacks.btnPress | DeviceTypeCallbacks.busyLightChange | DeviceTypeCallbacks.downloadFirmwareProgress | DeviceTypeCallbacks.onBTParingListChange |
                DeviceTypeCallbacks.onGNPBtnEvent | DeviceTypeCallbacks.onDevLogEvent | DeviceTypeCallbacks.onBatteryStatusUpdate | DeviceTypeCallbacks.onUploadProgress): this {

      this._eventEmitter.off(event, listener);

      return this;
   }
}