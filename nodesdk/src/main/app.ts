import { SdkIntegration, AddonLogSeverity } from "./sdkintegration";
import { isNodeJs } from './util';

// Browser friendly type-only import:
type _EventEmitter = import('events').EventEmitter;

/** @internal */
let sdkIntegration: SdkIntegration;

/** @internal */
let events: any;

// @ts-ignore
if (isNodeJs()) {
    // This statement should be executed under nodejs only to avoid browserfy problems.
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

import { MetaApi, ClassEntry, getJabraApiMetaSync } from './meta';

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

    /** @internal */
    constructor(appID: string, configCloudParams: ConfigParamsCloud, resolve: (value: JabraType) => void, reject: (reason: Error) => void) {
        // super();

        if (!isNodeJs()) {
            throw new Error("This JabraType constructor() function needs to run under NodeJs and not in a browser");
        }

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
            }, () => {
                try {
                    this.eventEmitter.emit('firstScanDone', undefined);
                    firstScanForDevicesDoneResolve();
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::firstScanDone callback", err);
                }
            }, (deviceData) => {
                try {
                    let deviceType = new DeviceType(deviceData);
                    this.deviceTypes.set(deviceData.deviceID, deviceType);
                    this.eventEmitter.emit('attach', deviceType);
                } catch (err) {
                    // Log but do not propagate js errors into native caller (or node process will be aborted):
                    sdkIntegration.NativeAddonLog(AddonLogSeverity.error, "JabraType::constructor::attach callback", err);
                }
            }, (deviceId) => {
                try {
                    let deviceType = this.deviceTypes.get(deviceId);
                    if (deviceType) {
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
            },
            configCloudParams);  
        });
    }

    /**
     * The user must call this function when finished using the wrapper. Otherwise
     * the node process will not shutdown properly.
     */
    disposeAsync(): Promise<void> {
        sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "JabraType::disposeAsync", "Dispose of API started");

        this.eventEmitter.removeAllListeners();

        let retPromise: Promise<void>;
        if (!sdkIntegration.UnInitialize()) {
            sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "JabraType::disposeAsync", "Dispose of API failed.")

            retPromise=Promise.reject("Failed uninitializing");
        } else {
            this.deviceTypes.clear();
            jabraApp = null;
            sdkIntegration.NativeAddonLog(AddonLogSeverity.info, "JabraType::disposeAsync", "Dispose of API succeded")
            retPromise=Promise.resolve();
        }

        return retPromise;
    }

    getAttachedDevices(): Map<number, DeviceType> {
        return this.deviceTypes;
    }
    
    connectToJabraApplicationAsync(guid: string, softphoneName: string): Promise<boolean> {
        return util.promisify(sdkIntegration.ConnectToJabraApplication)(guid, softphoneName);
    }

    disconnectFromJabraApplicationAsync(): Promise<void> {
        return util.promisify(sdkIntegration.DisconnectFromJabraApplication)();
    }

    setSoftphoneReadyAsync(isReady: boolean): Promise<void> {
        return util.promisify(sdkIntegration.SetSoftphoneReady)(isReady);
    }

    isSoftphoneInFocusAsync(): Promise<boolean> {
        return util.promisify(sdkIntegration.IsSoftphoneInFocus)();
    }

    /** 
     * Wait for initial device scan to be done.
     */
    scanForDevicesDoneAsync(): Promise<void>  {
        return this.firstScanForDevicesDonePromise;
    }    

    getSDKVersionAsync(): Promise<string> {
        return util.promisify(sdkIntegration.GetVersion)();
    }

    getErrorStringAsync(errStatusCode: number): Promise<string> {
        return util.promisify(sdkIntegration.GetErrorString)(errStatusCode);
    }

    /**
     * Get meta information about methods, properties etc. that can be used 
     * for reflective usage of this class.
     */
    getMeta() : ClassEntry {
        const jabraClassName = this.constructor.name;
        const apiMeta = getJabraApiMetaSync();
        let jabraTypeMeta = apiMeta.find((c) => c.name === jabraClassName);
        if (!jabraTypeMeta)
            throw new Error("Could not find meta data for " + jabraClassName);
        return jabraTypeMeta;
    }

    on(event: 'attach', listener: JabraTypeCallbacks.attach): this;   
    on(event: 'detach', listener: JabraTypeCallbacks.detach): this;
    on(event: 'firstScanDone', listener: JabraTypeCallbacks.firstScanDone): this;

    on(event: JabraTypeEvents,
        listener: JabraTypeCallbacks.attach | JabraTypeCallbacks.detach | JabraTypeCallbacks.firstScanDone): this {

        this.eventEmitter.on(event, listener);

        return this;
    }

    off(event: 'attach', listener: JabraTypeCallbacks.attach): this;
    off(event: 'detach', listener: JabraTypeCallbacks.detach): this;
    off(event: 'firstScanDone', listener: JabraTypeCallbacks.firstScanDone): this;

    off(event: JabraTypeEvents,
        listener: JabraTypeCallbacks.attach | JabraTypeCallbacks.detach | JabraTypeCallbacks.firstScanDone): this {

        this.eventEmitter.off(event, listener);

        return this;
    }
}





