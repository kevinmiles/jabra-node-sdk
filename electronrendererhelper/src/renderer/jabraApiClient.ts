
// Browser friendly type-only imports as we can assume the electron app has these types loaded already.
type IpcRenderer = import('electron').IpcRenderer;

import { ClassEntry, JabraType, DeviceInfo, 
         enumDeviceBtnType, enumFirmwareEventType, enumFirmwareEventStatus, PairedListInfo, enumUploadEventStatus,
         JabraTypeEvents, DeviceTypeEvents, JabraEventsList, DeviceEventsList, DeviceType, MetaApi, MethodEntry, AddonLogSeverity } from '@gnaudio/jabra-node-sdk';
import { getExecuteDeviceTypeApiMethodEventName, getDeviceTypeApiCallabackEventName, getJabraTypeApiCallabackEventName, 
         getExecuteJabraTypeApiMethodEventName, getExecuteJabraTypeApiMethodResponseEventName, 
         getExecuteDeviceTypeApiMethodResponseEventName, createApiClientInitEventName, jabraLogEventName } from '../common/ipc';
import { nameof, isBrowser } from '../common/util';

/**
* Factory method for creating promise returning remote client-side instance of JabraType.
*/
export function createApiClient(ipcRenderer: IpcRenderer) : Promise<JabraType> {
    if (!isBrowser()) {
        return Promise.reject(new Error("This createApiClient() function needs to run in a browser process"));
    }

    if (!ipcRenderer) {  
        return Promise.reject(new Error("ipcRenderer argument missing to createApiClient() factory method"));
    }

    return new Promise<JabraType>((resolve, reject) => {
        try {
            JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.info, "createApiClient", "Looking up Jabra API meta data");
            let apiMeta: ReadonlyArray<ClassEntry> | Error = ipcRenderer.sendSync(createApiClientInitEventName);

            if (apiMeta && Array.isArray(apiMeta)) {
                const jabraClassName = JabraType.name;
                let jabraTypeMeta = apiMeta.find((c) => c.name === jabraClassName);
                if (!jabraTypeMeta) {
                    let error = new Error("Could not find meta data for " + jabraClassName);
                    JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "createApiClient", error);
                    return Promise.reject(error);
                }
        
                const deviceClassName = DeviceType.name;
                let deviceTypeMeta = apiMeta.find((c) => c.name === deviceClassName);
                if (!deviceTypeMeta) {
                    let error = new Error("Could not find meta data for " + deviceClassName);
                    JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "createApiClient", error);
                    return Promise.reject(error);
                }

                let result = doCreateRemoteJabraType(jabraTypeMeta, deviceTypeMeta, ipcRenderer);
                
                JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.info, "createApiClient", "Client side JabraType proxy succesfully created");
                return resolve(result);
            } else {
                JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "createApiClient", apiMeta as Error);
                return reject(apiMeta);
            }
        } catch (err) {
            let combinedError = new Error("Internal error during meta retrivial / construction of remote proxy. Got error " + err);
            JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "createApiClient", combinedError);
            return reject(combinedError);
        }
    });
}


/**
 * The generalized event callback used for jabra api.
 */
type EventCallback =  (...args: any[]) => void;

/**
 * The generalized event handling api in commen for all jabra api objects.
 */
interface JabraEventManagementApi {
    on: (eventName: any, callback: EventCallback) => any,
    off: (eventName: any, callback: EventCallback) => any
}

interface DeviceTypeExtras {
    /**
     * Internal method that is called whenever we are finished with a device object, 
     * so relevant resources can be freed.
     */
    _shutdown(): void;
}

/**
 * Internal helper that stores information about the promise to resolve/reject
 * for a command being processed.
 */
interface PromiseCallbacks {
    methodName: string,
    resolve: (value?: any | PromiseLike<any> | undefined) => void;
    reject: (err: Error) => void;
}

/**
 * Helper that create a js proxy handler for a api class meta description. Mehod execution and event management
 * must be handled by provided delegating callbacks.
 */
function doCreateProxy<T extends (MetaApi & JabraEventManagementApi)>(meta: ClassEntry, 
                                          methodExecutor: (methodName: string, methodMeta: MethodEntry, ...args : any[]) => any,
                                          on: (eventName: string, callback: EventCallback) => any,
                                          off: (eventName: string, callback: EventCallback) => any
                                         ) : ProxyHandler<T> {
    return {
        get: (target, propKey, receiver) => {
            let propName = propKey.toString();
            let methodEntry: MethodEntry | undefined;
            if (propKey === Symbol.toPrimitive) {
                return undefined; // Not supported.
            } else if (propName === nameof<Object>("toString") || propName === nameof<Object>("toLocaleString")) {
                return () => "[object proxy for " + meta.name + "]";
            } else if (propName === nameof<Object>("valueOf")) {
                return () => JSON.stringify(target, null, 2);
            } else if (propName === "toJSON") {
                return () => target;
            } else if (propName ===  nameof<T>("getMeta")) {
                return meta; // Use local value for efficiency rather than server side value.
            } else if (propName === nameof<T>("on")) {
                return (eventName: string, callback: EventCallback) => {
                    on(eventName, callback);  
                };
            } else if (propName === nameof<T>("off")) {
                return (eventName: string, callback: EventCallback) => {
                    off(eventName, callback);
                };
            } else if (meta.properties.find(p => p.name === propName)) {
                // Properties (if any) are stored on local object (all readonly).
                return Reflect.get(target, propKey);
            } else if ((methodEntry = meta.methods.find(m => m.name === propName)) || propName.startsWith("_")) {
                return (...args : any[]) => {
                    return methodExecutor(propKey.toString(), methodEntry!, ...args);
                };
            } else {
                return undefined;
            }
        },

        setPrototypeOf: (target: T, v: any) : boolean => {
            throw new TypeError("setPrototypeOf not supported");
        },
        
        isExtensible: (target: T): boolean => {
            return false;
        },

        preventExtensions: (target: T): boolean => {
            return true;
        },

        getOwnPropertyDescriptor: (target: T, p: PropertyKey): PropertyDescriptor | undefined => {
            let key = p.toString();
            let propIndex = meta.properties.findIndex(p => p.name === key);
            if (propIndex) {
                return {
                    configurable: false,
                    enumerable: true,
                    writable: !meta.properties[propIndex].readonly,
                    value: (target as any)[key]
                }
            } 

            let methodIndex =  meta.methods.findIndex(p => p.name === key);
            if (methodIndex) {
                return {
                    configurable: false,
                    enumerable: true,
                    writable: false,
                    value: undefined
                }
            }

            return undefined;
        },

        has: (target: T, p: PropertyKey): boolean => {
            let key = p.toString();
            return meta.properties.findIndex(p => p.name === key) >=0 || meta.methods.findIndex(p => p.name === key) >= 0;
        },

        set: (target: T, p: PropertyKey, value: any, receiver: any): boolean => {
            throw new TypeError("set not supported");
        },

        deleteProperty: (target: T, p: PropertyKey): boolean => {
            throw new TypeError("deleteProperty not supported");
        },

        defineProperty: (target: T, p: PropertyKey, attributes: PropertyDescriptor): boolean => {
            throw new TypeError("defineProperty not supported");
        },

        enumerate: (target: T): PropertyKey[] => {
            return [...meta.properties.map(p => p.name), ...meta.methods.map(p => p.name)];
        },

        ownKeys: (target: T): PropertyKey[] => {
            return [...meta.properties.map(p => p.name), ...meta.methods.map(p => p.name)];
        },

        apply: (target: T, thisArg: any, argArray?: any): any => {
            throw new TypeError("apply not supported");
        },

        construct: (target: T, argArray: any, newTarget?: any): object => {
            throw new TypeError("construct not supported");
        }
    };

}

/**
 * Handles event subscription and emits like a simple EventEmitter
 * that can be used client-side.
 */
class SimpleEventEmitter<T extends string> {   
    private _eventListeners: Map<T, Array<EventCallback>> = new Map<T, Array<EventCallback>>();
    private _events: ReadonlyArray<T>;
    
    constructor(events: ReadonlyArray<T>) {
        this._events = events;
        this._events.forEach((event: T) => this._eventListeners.set(event, []));
    }

    emit(eventName: T, ...args: any[]) {
        let callbacks = this._eventListeners.get(eventName);
        if (callbacks) {
            callbacks.forEach((callback) => {
                callback(...args);
            });
        } 
    }
    
    on(eventName: T, callback: EventCallback) {
        let callbacks = this._eventListeners.get(eventName);
        if (!callbacks!.find((c) => c === callback)) {
          callbacks!.push(callback);
        }
    }

    off(eventName: T, callback: EventCallback) {
        let callbacks = this._eventListeners.get(eventName);
        let findIndex = callbacks!.findIndex((c) => c === callback);
        if (findIndex >= 0) {
            callbacks!.splice(findIndex, 1);
        }
    }
    
    removeAllListeners() {
        this._eventListeners.forEach((l) => {
            l.length = 0;
        });
    }
}

/**
 * Create remote remote JabraType using a proxy that forwards events and commands using ipc
 */
function doCreateRemoteJabraType(jabraTypeMeta: ClassEntry, deviceTypeMeta: ClassEntry, ipcRenderer: IpcRenderer) : JabraType {
    const devices = new Map<number, DeviceType & DeviceTypeExtras>();
    const resultsByExecutionId = new Map<Number, PromiseCallbacks>();

    const eventEmitter = new SimpleEventEmitter<JabraTypeEvents>(JabraEventsList);
    let methodExecutionId : number = 0;

    function emitEvent(eventName: JabraTypeEvents, ...args: any[]) {
        eventEmitter.emit(eventName, ...args);
    }
    
    function executeOn(eventName: string, callback: EventCallback) {
        eventEmitter.on(eventName as JabraTypeEvents, callback);
    }

    function executeOff(eventName: string, callback: EventCallback) {
        eventEmitter.off(eventName as JabraTypeEvents, callback);
    }   

    function executeApiMethod(methodName: string, methodMeta: MethodEntry, ...args : any[]) : any {
        if (methodName == nameof<JabraType>("getAttachedDevices")) {
            // Return our own list of proxies devices for this method !!
            return Array.from(devices.values());
        } else {
            const thisMethodId = methodExecutionId++;
            let combinedEventArgs = [ methodName, thisMethodId, ...args];
            ipcRenderer.send(getExecuteJabraTypeApiMethodEventName(), ...combinedEventArgs);

            if (methodMeta.jsType===Promise.name) {
                return new Promise(function(resolve, reject) {
                    resultsByExecutionId.set(thisMethodId, { methodName, resolve, reject });
                });
            } else {
                // For now, we only need to support async remote method (returning promises). If needed in the future, 
                // such methods could be easily supported by calling ipcRenderer.sendSync instead and handle that on the server.
                let error = new Error("This remote client currently only support async remote methods that return promises unlike '" + methodName + "'."); 
                console.warn(error);
                JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "doCreateRemoteJabraType.executeApiMethod", error);
                throw error;
            }
        }
    }

    /**
     * Receive async method execiution results and resolve/reject corresponding promises.
     */
    ipcRenderer.on(getExecuteJabraTypeApiMethodResponseEventName(), (event, methodName: string, executionId: number, err: any, result: any) => {
        let promiseCallbacks = resultsByExecutionId.get(executionId);
        if (promiseCallbacks) {
            resultsByExecutionId.delete(executionId);
            
            if (methodName !== promiseCallbacks.methodName) {
                let internalError = new Error("Internal error - Expected method name " + methodName + " does match actual method name " + promiseCallbacks.methodName + " for executionId " + executionId);
                console.warn(internalError.message);
                JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.warning, "doCreateRemoteJabraType", internalError);
                promiseCallbacks.reject(internalError);
            } else if (err) {
                promiseCallbacks.reject(err);
            } else {
                promiseCallbacks.resolve(result);
            }

            if (methodName == nameof<JabraType>("disposeAsync")) {
                shutdown();
            };
        } else {
            let internalError = new Error("Internal error - Could not find callback for method name " + methodName + " with executionId " + executionId);
            console.warn(internalError.message);
            JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.warning, "doCreateRemoteJabraType", internalError);
        }
    });

    ipcRenderer.on(getJabraTypeApiCallabackEventName('attach'), (event, deviceInfo: DeviceInfo) => {
        let device = createRemoteDeviceType(deviceInfo, deviceTypeMeta, ipcRenderer);       
        devices.set(deviceInfo.deviceID, device);
        emitEvent('attach', device);
    });
  
    ipcRenderer.on(getJabraTypeApiCallabackEventName('detach'), (event, deviceInfo: DeviceInfo) => {
        let device = devices.get(deviceInfo.deviceID);
        if (device) {
            devices.delete(deviceInfo.deviceID);
            emitEvent('detach', device);
            device._shutdown();
        } else {
            // If we can't find the device it must be because it was attached in a previous session.
            let error = new Error("Failure to find device with id " + deviceInfo.deviceID + " in mapping.");
            console.warn(error);
            JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.warning, "doCreateRemoteJabraType", error);
        }
    });

    ipcRenderer.on(getJabraTypeApiCallabackEventName('firstScanDone'), (event) => {
        emitEvent('firstScanDone');
    });

    function shutdown() {
        JabraEventsList.forEach((e) => {
            ipcRenderer.removeAllListeners(getJabraTypeApiCallabackEventName(e));
        });

        devices.forEach( (device, key) => {
            device._shutdown();
        });

        eventEmitter.removeAllListeners();
    }

    const proxyHandler = doCreateProxy<JabraType>(jabraTypeMeta, executeApiMethod, executeOn, executeOff);

    return new Proxy<JabraType>({} as JabraType, proxyHandler);
}

/**
 * Create remote DeviceType using a proxy that forwards events and commands using ipc.
 */
function createRemoteDeviceType(deviceInfo: DeviceInfo, deviceTypeMeta: ClassEntry, ipcRenderer: IpcRenderer) : DeviceType & DeviceTypeExtras {
    const eventEmitter = new SimpleEventEmitter<DeviceTypeEvents>(DeviceEventsList);

    const resultsByExecutionId = new Map<Number, PromiseCallbacks>();
    let methodExecutionId : number = 0;

    function emitEvent(eventName: DeviceTypeEvents, ...args: any[]) {
        eventEmitter.emit(eventName, ...args);
    }
    
    function executeOn(eventName: string, callback: EventCallback) {
        eventEmitter.on(eventName as DeviceTypeEvents, callback);
    }

    function executeOff(eventName: string, callback: EventCallback) {
        eventEmitter.off(eventName as DeviceTypeEvents, callback);
    }  
    
    function executeApiMethod(methodName: string, methodMeta: MethodEntry, ...args : any[]) : any {
        if (methodName == nameof<DeviceTypeExtras>("_shutdown")) {
            // Special local handling for when we are finshed with the device.
            shutdown();
        } else {
            const thisMethodExecutionId = methodExecutionId++;
            let combinedEventArgs = [ methodName, thisMethodExecutionId, ...args];
            if (methodMeta.jsType===Promise.name) {
                ipcRenderer.send(getExecuteDeviceTypeApiMethodEventName(deviceInfo.deviceID), ...combinedEventArgs);
                return new Promise(function(resolve, reject) {
                    resultsByExecutionId.set(thisMethodExecutionId, { methodName, resolve, reject });
                });
            } else {
                // For now, we only need to support async remote method (returning promises). If needed in the future, 
                // such methods could be easily supported by calling ipcRenderer.sendSync instead and handle that on the server.
                let error = new Error("This remote client currently only support async remote methods that return promises unlike '" + methodName + "'.");
                JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "createRemoteDeviceType", error);
                throw error;
            }
        }
    }

    /**
     * Receive async method execiution results and resolve/reject corresponding promises.
     */
    ipcRenderer.on(getExecuteDeviceTypeApiMethodResponseEventName(deviceInfo.deviceID), (event, methodName: string, executionId: number, err: any, result: any) => {
        let promiseCallbacks = resultsByExecutionId.get(executionId);
        if (promiseCallbacks) {
            resultsByExecutionId.delete(executionId);
            
            if (methodName !== promiseCallbacks.methodName) {
                let internalError = new Error("Internal error - Expected method name " + methodName + " does match actual method name " + promiseCallbacks.methodName + " for executionId " + executionId + " and device with Id " + deviceInfo.deviceID);
                console.error(internalError.message);
                JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.error, "createRemoteDeviceType", internalError);
                promiseCallbacks.reject(internalError);
            } else if (err) {
                promiseCallbacks.reject(err);
            } else {
                promiseCallbacks.resolve(result);
            }
        } else {
            let internalError = new Error("Internal error - Could not find callback for method name " + methodName + " with executionId " + executionId + " and device with Id " + deviceInfo.deviceID);
            console.warn(internalError.message);
            JabraNativeAddonLog(ipcRenderer, AddonLogSeverity.warning, "createRemoteDeviceType", internalError)
        }
    });
        
    ipcRenderer.on(getDeviceTypeApiCallabackEventName('btnPress', deviceInfo.deviceID), (event, btnType: enumDeviceBtnType, value: boolean) => {
        emitEvent('btnPress', btnType, value);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('busyLightChange', deviceInfo.deviceID), (event, status: boolean) => {
        emitEvent('busyLightChange', status);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('downloadFirmwareProgress', deviceInfo.deviceID), (event, type: enumFirmwareEventType, status: enumFirmwareEventStatus, dwnldStatusInPrcntg: number) => {
        emitEvent('downloadFirmwareProgress', type, status, dwnldStatusInPrcntg);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('onBTParingListChange', deviceInfo.deviceID), (event, pairedListInfo: PairedListInfo) => {
        emitEvent('onBTParingListChange', pairedListInfo);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('onGNPBtnEvent', deviceInfo.deviceID), (event, btnEvents: Array<{
        buttonTypeKey: number;
        buttonTypeValue: string;
        buttonEventType: Array<{
            key: number;
            value: string;
        }>;
    }>) => {
        emitEvent('onGNPBtnEvent', btnEvents);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('onDevLogEvent', deviceInfo.deviceID), (event, eventString: string) => {
        emitEvent('onDevLogEvent', eventString);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('onBatteryStatusUpdate', deviceInfo.deviceID), (event, levelInPercent: number, isCharging: boolean, isBatteryLow: boolean) => {
        emitEvent('onBatteryStatusUpdate', levelInPercent, isCharging, isBatteryLow);
    });

    ipcRenderer.on(getDeviceTypeApiCallabackEventName('onUploadProgress', deviceInfo.deviceID), (event, status: enumUploadEventStatus, levelInPercent: number) => {
        emitEvent('onUploadProgress', status, levelInPercent);
    });

    function shutdown() {
        DeviceEventsList.forEach((e) => {
            ipcRenderer.removeAllListeners(getDeviceTypeApiCallabackEventName(e, deviceInfo.deviceID));
        });

        eventEmitter.removeAllListeners();
    }

    const proxyHandler = doCreateProxy(deviceTypeMeta, executeApiMethod, executeOn, executeOff);
    return new Proxy<DeviceType & DeviceTypeExtras>(deviceInfo as (DeviceType & DeviceTypeExtras), proxyHandler);
}

/**
 * Internal helper for sending log info to Jabra native log - used to integrate logs for diagnosing errors.
 */
function JabraNativeAddonLog(ipcRenderer: IpcRenderer, severity: AddonLogSeverity, caller: string, msg: string | Error)
{
    try {
      ipcRenderer.send(jabraLogEventName, severity, caller, msg);
    } catch (e) { // Swallow exceptions to make this call safe to call anywhere.
        console.error(e);
    }
}

