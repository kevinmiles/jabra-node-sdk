import { SdkIntegration } from "./sdkintegration";
import { AddonLogSeverity } from "./core-types";
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
         FirmwareInfoType, SettingType, DeviceSettings } from './core-types';

import { enumAPIReturnCode, enumDeviceErrorStatus, enumDeviceBtnType, enumDeviceConnectionType,
         enumSettingDataType, enumSettingCtrlType, enumSettingLoadMode, enumFirmwareEventStatus,
         enumFirmwareEventType, enumBTPairedListType, enumUploadEventStatus, audioFileFormat,
         enumDeviceFeature, enumHidState, enumWizardMode, enumLogging } from './jabra-enums';

import { MetaApi, ClassEntry, _getJabraApiMetaSync } from './meta';

import * as util from 'util';

import { DeviceType } from './device';

// Singleton containing our top-level object.
/** @internal */
let jabraApp: Promise<JabraType> | null = null;

/**
 * This function should be called to create/get the main JabraType (application) instance.
 * @param appID The user should first register the app on [Jabra developer site](https://developer.jabra.com/) to get application id.
 * @param configCloudParams Optional configuration parameters for the sdk.
 */
export function createJabraApplication(appID: string, configCloudParams: ConfigParamsCloud = {}): Promise<JabraType> {
    // TODO: What should be done if configCloudParams is different ?

    if (!isNodeJs()) {
        return Promise.reject(new Error("This createJabraApplication() function needs to run under NodeJs and not in a browser"));
    }

    if (!jabraApp) {
        sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "createJabraApplication", "Init - Creating new jabraApp");
        jabraApp = new Promise<JabraType>((resolve, reject) => {
            return new JabraType(appID, configCloudParams, resolve, reject);
        });
    } else {
        sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "createJabraApplication", "Init - Reuseing existing jabraApp");
    }

    return jabraApp;
}

export namespace JabraTypeCallbacks {
    export type attach = (device: DeviceType) => void;
    export type detach = (device: DeviceType) => void;
    export type firstScanDone = () => void;
}

export type JabraTypeEvents = 'attach' | 'detach' | 'firstScanDone';

export const JabraEventsList: JabraTypeEvents[] = ['attach', 'detach', 'firstScanDone'];

/** 
 * Main API class return by createJabraApplication.   
 */
export class JabraType implements MetaApi {
    /** @internal */
    private readonly eventEmitter: _EventEmitter;

    /** @internal */
    private readonly deviceTypes: Map<number, DeviceType>;

    /** @internal */
    private readonly firstScanForDevicesDonePromise: Promise<void>;

    /**
     * The application Id used to instantiate the Api.
     * 
     * Nb. Not applicable for client side proxies.
     */
    public readonly appID?: string;

    /** 
     * @internal 
     * @hidden
     **/
    constructor(appID: string, configCloudParams: ConfigParamsCloud, resolve: (value: JabraType) => void, reject: (reason: Error) => void) {
        if (!isNodeJs()) {
            throw new Error("This JabraType constructor() function needs to run under NodeJs and not in a browser");
        }

        this.appID = appID;

        this.eventEmitter = new events.EventEmitter();
    
        this.deviceTypes = new Map<number, DeviceType>();

        this.firstScanForDevicesDonePromise = new Promise<void>(( firstScanForDevicesDoneResolve, firstScanForDevicesDoneReject ) => {
            sdkIntegration.Initialize( appID, (err, success) => {
                try {
                    if (err) {
                        let errObj = new Error("Initialization error " + err);
                        reject(errObj);
                        firstScanForDevicesDoneReject(errObj);
                    } else {
                        resolve(this);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::success callback", err);
                }
            }, (event_time_ms) => {
                try {
                    this.eventEmitter.emit('firstScanDone', undefined);
                    firstScanForDevicesDoneResolve();
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::firstScanDone callback", err);
                }
            }, (deviceData, event_time_ms) => {
                try {
                    let deviceType = new DeviceType(deviceData, event_time_ms);
                    this.deviceTypes.set(deviceData.deviceID, deviceType);
                    this.eventEmitter.emit('attach', deviceType);
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::attach callback", err);
                }
            }, (deviceId, event_time_ms) => {
                try {
                    let deviceType = this.deviceTypes.get(deviceId);
                    if (deviceType) {
                        // Assign to detached_time_ms even though it is formally a readonly because we don't want clients to change it.
                        (deviceType.detached_time_ms as DeviceType['detached_time_ms']) = event_time_ms;
                        this.deviceTypes.delete(deviceId);
                        this.eventEmitter.emit('detach', deviceType);                        
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::detach callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::detach callback", err);
                }
            }, (deviceId, translatedInData, buttonInData) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('btnPress', translatedInData, buttonInData);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "buttonInDataTranslated callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::buttonInDataTranslated callback", err)
                }
            }, (deviceId, jsonData) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('onDevLogEvent', jsonData);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "onDevLogEvent callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::onDevLogEvent callback", err)
                }
            }, (deviceId, levelInPercent, isCharging, isBatteryLow) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('onBatteryStatusUpdate', levelInPercent, isCharging, isBatteryLow);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "onBatteryStatusUpdate callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::onBatteryStatusUpdate callback", err)
                }
            }, (deviceId, type, status, dwnFirmPercentage) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('downloadFirmwareProgress', type, status, dwnFirmPercentage);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "downloadFirmwareProgress callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::downloadFirmwareProgress callback", err)
                }
            }, (deviceId, status, percentage) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('onUploadProgress', status, percentage);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "onUploadProgress callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::onUploadProgress callback", err)
                }
            }, (deviceId, pairedListInfo) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('onBTParingListChange', pairedListInfo);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "onBTParingListChange callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::onBTParingListChange callback", err)
                }
            }, (deviceId, buttonEvents) => {
                try {
                    let device = this.deviceTypes.get(deviceId);
                    if (device) {
                        device._eventEmitter.emit('onGNPBtnEvent', buttonEvents);
                    } else {
                        sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "onGNPBtnEventChange callback", "Could not lookup device with id " + deviceId);
                    }
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::onGNPBtnEventChange callback", err)
                }
            },
            configCloudParams);  
        });
    }

    /**
     * The user must call this function when finished using the wrapper. Otherwise
     * the node process will not shutdown properly.
     * @returns {Promise<void, Error>} - Resolve `void` if successful otherwise Reject with `error`. 
     */
    disposeAsync(): Promise<void> {
        sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "JabraType::disposeAsync", "Dispose of API started");

        this.eventEmitter.removeAllListeners();

        let retPromise: Promise<void>;
        if (!sdkIntegration.UnInitialize()) {
            sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "JabraType::disposeAsync", "Dispose of API failed.")

            retPromise = Promise.reject(new Error("Failed uninitializing"));
        } else {
            this.deviceTypes.clear();
            jabraApp = null;
            sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "JabraType::disposeAsync", "Dispose of API succeded")
            retPromise = Promise.resolve();
        }

        return retPromise;
    }

    /**
     * Get list of currently attached Jabra devices.
     */
    getAttachedDevices(): DeviceType[] {
        return Array.from(this.deviceTypes.values());
    }

    /**
     * Integrates softphone app to Jabra applications like Jabra Direct(JD) and Jabra Suite for Mac(JMS).
     * @param {string} guid Client unique ID.
     * @param {string} softphoneName Name of the application to be shown in JD or JMS.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`. 
     * - Returns `true` if softphone app integrates to Jabra application, `false` otherwise.
     */   
    connectToJabraApplicationAsync(guid: string, softphoneName: string): Promise<boolean> {
        return util.promisify(sdkIntegration.ConnectToJabraApplication)(guid, softphoneName);
    }

    /**
     * Disconnects connected from Jabra applications.
     * @returns {Promise<void, Error>} - Resolve `void` if successful otherwise Reject with `error`. 
     */
    disconnectFromJabraApplicationAsync(): Promise<void> {
        return util.promisify(sdkIntegration.DisconnectFromJabraApplication)();
    }

    /**
     * Sets the softphone to Ready. Currently applicable for only Jabra Direct.
     * @param {boolean} isReady Sets the softphone readiness state.
     * @returns {Promise<void, Error>} - Resolve `void` if successful otherwise Reject with `error`.
     */
    setSoftphoneReadyAsync(isReady: boolean): Promise<void> {
        return util.promisify(sdkIntegration.SetSoftphoneReady)(isReady);
    }

    /**
     * Indicates whether the softphone is in focus.
     * @returns {Promise<boolean, Error>} - Resolve `boolean` if successful otherwise Reject with `error`.
     * - Returns `true` if softphone is in focus, `false` otherwise.
     */
    isSoftphoneInFocusAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsSoftphoneInFocus)();
    }

    /** 
     * Wait for initial device scan to be done.
     */
    scanForDevicesDoneAsync(): Promise<void>  {
        return this.firstScanForDevicesDonePromise;
    }    

    /**
     * Get the SDK version.
     * @returns {Promise<string, Error>} - Resolve SDK version `string` if successful otherwise Reject with `error`.
     */
    getSDKVersionAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetVersion)();
    }

    /**
     * Get error string from a previously returned SDK error status.
     * @param {number} errStatusCode Status code of the error from the Jabra Device.
     * @returns {Promise<string, Error>} - Resolve Error String `string` if successful otherwise Reject with `error`.
    */
    getErrorStringAsync(errStatusCode: number): Promise<string> {
        return util.promisify(sdkIntegration.GetErrorString)(errStatusCode);
    }

    /** 
     * Internal function for N-API experimentation only - it may be removed/changed at 
     * any time without warning - do not call.
     * 
     * @internal 
     * @hidden
     **/
    _SyncExperiment(p?: any): any {
        return sdkIntegration.SyncExperiment(p);
    }

    /**
     * Get meta information about methods, properties etc. that can be used 
     * for reflective usage of this class.
     */
    getMeta() : ClassEntry {
        const jabraClassName = this.constructor.name;
        const apiMeta = _getJabraApiMetaSync();
        let jabraTypeMeta = apiMeta.find((c) => c.name === jabraClassName);
        if (!jabraTypeMeta)
            throw new Error("Could not find meta data for " + jabraClassName);
        return jabraTypeMeta;
    }

    /**
     * Add event handler for attach device events. The attach event is 
     * particulary important, since this callback is where you get a reference to a DeviceType
     * object with detailed API for the device.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    on(event: 'attach', listener: JabraTypeCallbacks.attach): this; 
    
    /**
     * Add event handler for detach device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    on(event: 'detach', listener: JabraTypeCallbacks.detach): this;

    /**
     * Add event handler for firstScanDone device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    on(event: 'firstScanDone', listener: JabraTypeCallbacks.firstScanDone): this;

    /**
     * Add event handler for attach, detach or firstScanDone device events. The attach event is 
     * particulary important, since this callback is where you get a reference to a DeviceType
     * object with detailed API for the device.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    on(event: JabraTypeEvents,
        listener: JabraTypeCallbacks.attach | JabraTypeCallbacks.detach | JabraTypeCallbacks.firstScanDone): this {

        this.eventEmitter.on(event, listener);

        return this;
    }

    /**
     * Remove previosly setup event handler for attach device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    off(event: 'attach', listener: JabraTypeCallbacks.attach): this;

    /**
     * Remove previosly setup event handler for detach device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    off(event: 'detach', listener: JabraTypeCallbacks.detach): this;

    /**
     * Remove previosly setup event handler for firstScanDone device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    off(event: 'firstScanDone', listener: JabraTypeCallbacks.firstScanDone): this;

    /**
     * Remove previosly setup event handler for attach, detach or firstScanDone device events.
     * 
     * *Please make sure your callback arguments matches the event type or you will get a misleading typescript error. See also {@link https://github.com/microsoft/TypeScript/issues/30843 30843}*
     */
    off(event: JabraTypeEvents,
        listener: JabraTypeCallbacks.attach | JabraTypeCallbacks.detach | JabraTypeCallbacks.firstScanDone): this {

        this.eventEmitter.off(event, listener);

        return this;
    }
}





