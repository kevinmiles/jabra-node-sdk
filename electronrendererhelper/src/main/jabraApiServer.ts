
// Browser friendly type-only imports as we can assume the 
// electron app has these types loaded already.
type BrowserWindow = import('electron').BrowserWindow;
type IpcMain = import('electron').IpcMain;

import { isNodeJs, nameof, serializeError } from '../common/util';

import { _getJabraApiMetaSync, createJabraApplication, JabraType, ConfigParamsCloud,
         DeviceEventsList, ClassEntry, DeviceType,
         _JabraGetNativeAddonLogConfig, _JabraNativeAddonLog, NativeAddonLogConfig, AddonLogSeverity } from '@gnaudio/jabra-node-sdk';

import { getExecuteDeviceTypeApiMethodEventName, getDeviceTypeApiCallabackEventName, 
         getJabraTypeApiCallabackEventName, getExecuteJabraTypeApiMethodEventName, 
         getExecuteJabraTypeApiMethodResponseEventName, 
         getExecuteDeviceTypeApiMethodResponseEventName,
         createApiClientInitEventName, jabraLogEventName, ApiClientInitEventData, jabraApiClientReadyEventName, ApiClientIntResponse, createApiClientInitResponseEventName } from '../common/ipc';

/**
 * This factory singleton is responsible for creating the server side Jabra API server that serves 
 * events and forwards commands for the corresponding (client side) createApiClient() helper.
 * 
 * Creation of the server, is a two-step process:
 * First this factory class must be instantiated BEFORE any window(s) are loaded, secondly after
 * the window(s) has been fully loaded, the factory create method can be called 
 * 
 * Nb. This factory is a singleton. Create only one instance of this class and in the main thread of Electron
 */
export class JabraApiServerFactory
{
    private readonly ipcMain: IpcMain;
    private jabraApiMeta: ClassEntry[];
    private jabraNativeAddonLogConfig: NativeAddonLogConfig | undefined;
    private startupError: Error | undefined;

    private clientInitResponsesRequested: ApiClientIntResponse[];

    private cachedApiServer: {
        server: Promise<JabraApiServer>,
        appID: string, 
        configCloudParams: ConfigParamsCloud, 
        fullyLoadedWindow: BrowserWindow;
    } | null;

    /**
     * Construct an JabraApiServer factory using a ready ipcMain instance. This constructor should
     * be called BEFORE any GUI is created.
     * 
     * This constructor only throws an error if called from a browser. Other server-side errors in the
     * constructor are catched and result subsequently in a rejected create() promise. This happens
     * to ensure the election main process is not terminated before an error can be shown.
     */
    public constructor(ipcMain: IpcMain) {
        if (!isNodeJs()) {
            let error = new Error("This JabraApiServerFactory class needs to run under NodeJs and not in a browser");
            console.error(error); // Nb. In this case we can't log the error _JabraNativeAddonLog !
            throw error;
        }

        this.clientInitResponsesRequested = [];
        this.startupError = undefined;
        this.ipcMain = ipcMain;
        this.jabraApiMeta = [];
        this.jabraNativeAddonLogConfig = undefined;
        this.cachedApiServer = null;

        try {
            this.ipcMain = ipcMain;
            this.jabraApiMeta = _getJabraApiMetaSync();
            this.jabraNativeAddonLogConfig = _JabraGetNativeAddonLogConfig();
            if (!this.jabraNativeAddonLogConfig)
              throw new Error("Could not lookup Jabra log configuration");
        } catch (e) {
            this.startupError = e;
            _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServerFactory.constructor", JSON.stringify(e, null, 3));
        }

        
        if (ipcMain) {                    
            try {
                // Register client initializations so we can later serve configuration/meta data to them when 
                // server is fully up an running. We can't serve this data now, as the client api factory would 
                // then complete too soon, resulting in subsequent API calls that we are not ready to handle.
                this.ipcMain.on(createApiClientInitEventName, (mainEvent) => {
                    const frameId = mainEvent.frameId;
                    _JabraNativeAddonLog(AddonLogSeverity.info, "JabraApiServerFactory.constructor", "Jabra client initiailized - meta data requested by createApiClient at frame " + frameId);

                    // Add to queue of responses required once server is ready:
                    // Nb. Importantly "push" array operation must be used for this as we instrument this call later!
                    this.clientInitResponsesRequested.push({
                        frameId:  mainEvent.frameId,
                        response: serializeError(this.startupError) || {
                            logConfig: this.jabraNativeAddonLogConfig!,
                            apiMeta: this.jabraApiMeta
                        }    
                    });
                });

                // Log any string (!) messages received:
                // We do this here in the factory so we can catch also early logging requests from client:
                this.ipcMain.on(jabraLogEventName, (mainEvent, severity: AddonLogSeverity, caller: string, msg: string) => {
                    _JabraNativeAddonLog(severity, caller, msg);
                });
            } catch (e) {
                this.startupError = e;
                _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServerFactory.constructor", e);
            }
        } else {
            this.startupError = new Error("ipcMain argument missing to JabraApiServerFactory constructor");
        }

        if (!this.startupError) {
            _JabraNativeAddonLog(AddonLogSeverity.info, "JabraApiServerFactory.constructor", "JabraApiServerFactory sucessfully initialized");
        }
    }

    /**
     * Constructs a Jabra API server singleton instance after any GUI is loaded.
     * 
     * If called multiple times, this function must be called with same arguments as result is a singelton.
     * 
     * Nb. Importantly, the provided window must be fully loaded (use promise returned by electron's loadFile or
     * wait for electron's 'did-finish-load' event) before creating this object !
     * 
     */
    public create(appID: string, configCloudParams: ConfigParamsCloud, fullyLoadedWindow: BrowserWindow) : Promise<JabraApiServer> {
        if (this.cachedApiServer != null) {
            if (this.cachedApiServer.appID !== appID 
                || this.cachedApiServer.configCloudParams !== configCloudParams 
                || this.cachedApiServer.fullyLoadedWindow !== fullyLoadedWindow) {
                    return Promise.reject(new Error("JabraApiServerFactory.create must be called with identical parameters if called multiple times as return value is a singleton"));
                }

            return this.cachedApiServer.server;
        } else if (!this.startupError) {
            let server = JabraApiServer.create(appID, configCloudParams, this.ipcMain, this.jabraApiMeta, this.clientInitResponsesRequested, fullyLoadedWindow);
            this.cachedApiServer = {
                server,
                appID,
                configCloudParams,
                fullyLoadedWindow
            };
            return server;
        } else {
            return Promise.reject(this.startupError);
        }
    }
}

/**
 * Server side Jabra APi server that serves events and forwards commands for the 
 * corresponding (client side) createApiClient() helper.
 * 
 * Use JabraApiServerFactory to create this in the specified two-step process.
 */
export class JabraApiServer
{
    /**
     * Internal reference to api instance.
     * 
     * Use public getter to access from outside.
     */
    private jabraApi: JabraType | null;
    
    public readonly ipcMain: IpcMain;
    public readonly window: BrowserWindow;

    /**
     * Constructs a Jabra API server object.
     * 
     * Nb. Importantly, the provided window must be fully loaded (use promise returned by electron's loadFile or
     * wait for electron's 'did-finish-load' event) before creating this object !
     * 
     * @internal This function is intended for internal use only - clients should NOT use this - only our own factory!
     */
    public static create(appID: string, configCloudParams: ConfigParamsCloud, ipcMain: IpcMain, jabraApiMeta: ClassEntry[], clientInitResponsesRequested: ApiClientIntResponse[], window: BrowserWindow) : Promise<JabraApiServer> {
        return createJabraApplication(appID, configCloudParams).then( (jabraApi) => {
            const server = new JabraApiServer(jabraApi, ipcMain, jabraApiMeta, clientInitResponsesRequested, window);
            _JabraNativeAddonLog(AddonLogSeverity.info, "JabraApiServer.create", "JabraApiServer server ready");
            return server;
        });
    }

    /**
     * Return reference to the jabra Api (JabraType instance) being served.
     * This can be used if one need to call the Jabra API from within main instead of the client.
     */
    public getJabraApi(): JabraType | null {
        return this.jabraApi;
    }

    private constructor(jabraApi: JabraType, ipcMain: IpcMain, jabraApiMeta: ClassEntry[], clientInitResponsesRequested: ApiClientIntResponse[], window: BrowserWindow) {
        this.jabraApi = jabraApi;
        this.ipcMain = ipcMain;
        this.window = window;

        this.setupJabraEvents(jabraApi);
        this.setupElectonEvents(jabraApi);

        // Send requests for current and future clients waiting for delayed responses in clientInitResponsesRequested:
        // Nb. requires "push" to be used to add items in factory!!
        this.onClientInitResponsesRequestedChanged(clientInitResponsesRequested);
        clientInitResponsesRequested.push = (...args: any[]) => { 
            const retv = Array.prototype.push.apply(clientInitResponsesRequested, [...args]);
            this.onClientInitResponsesRequestedChanged(clientInitResponsesRequested);
            return retv;
        };
    }
    
    private onClientInitResponsesRequestedChanged(clientInitResponsesRequested: ApiClientIntResponse[]) {
        // Send delayed responses to client from our server that is now ready to process api calls:
        let responseRequested: ApiClientIntResponse | undefined;
        while ((responseRequested = clientInitResponsesRequested.shift())) {
            this.window.webContents.sendToFrame(responseRequested.frameId, createApiClientInitResponseEventName, responseRequested.response);
        }
    }

    private setupJabraEvents(jabraApi: JabraType) {
        jabraApi.on('attach', (device: DeviceType) => {
            let deviceData = this.getPublicDeviceData(device);      
           
            this.subscribeDeviceTypeEvents(device);
        
            this.window.webContents.send(getJabraTypeApiCallabackEventName('attach'), deviceData);
          });
      
        jabraApi.on('detach', (device: DeviceType) => {
            let deviceData = this.getPublicDeviceData(device);

            this.unsubscribeDeviceTypeEvents(device);

            this.window.webContents.send(getJabraTypeApiCallabackEventName('detach'), deviceData);
        });
      
        jabraApi.on('firstScanDone', () => {
            this.window.webContents.send(getJabraTypeApiCallabackEventName('firstScanDone'));
        });
    }

    /**
     * Helper that filter out internal data structures when forwarding data:
     */
    private getPublicDeviceData(device: DeviceType) {
        return Object.keys(device).filter(key => !key.startsWith("_")).reduce((obj, key) => {
            return {
              ...obj,
              [key]: (device as any)[key]
            };
        }, {});
    }

    private setupElectonEvents(jabraApi: JabraType) {
        // Normally the client will be ready before the server, but if client
        // is ready after the server (in case of a refresh) the client will be
        // missing some important attach events. Thus, we here listen for client
        // becoming ready after the server and replay attach events.
        this.ipcMain.on(jabraApiClientReadyEventName, (event, clientReadyTime: number) => {
            const frameId = event.frameId;
            const devices = jabraApi.getAttachedDevices().filter(device => device.attached_time_ms < clientReadyTime);
            if (devices.length > 0) {
                const deviceIds = devices.map(device => device.deviceID);
                _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServer.setupElectonEvents", "Replaying attach events to client for devices " + deviceIds.join(","));

                devices.forEach((device) => {
                    const deviceData = this.getPublicDeviceData(device);
                    this.window.webContents.sendToFrame(frameId, getJabraTypeApiCallabackEventName('attach'), deviceData);
                });
            }
        });

        // Receive JabraType api method calls from client:
        this.ipcMain.on(getExecuteJabraTypeApiMethodEventName(), (event, methodName: string, executionId: number, ...args: any[]) => {
            const frameId = event.frameId;
            try {
                const result = this.executeJabraApiCall(jabraApi, methodName, executionId, ...args);
                if (result instanceof Promise) {
                    result.then( (v) => {
                        this.window.webContents.sendToFrame(frameId, getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, undefined, v);
                    }).catch( (err) => {
                        this.window.webContents.sendToFrame(frameId, getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, serializeError(err), undefined);
                    });
                } else {
                    this.window.webContents.sendToFrame(frameId, getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, undefined, result);
                }
            } catch (err) {
                _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServer.setupElectonEvents", err);
                this.window.webContents.sendToFrame(frameId, getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, serializeError(err), undefined);
            }
        });
    }

    private subscribeDeviceTypeEvents(device: DeviceType) {
        // Receive DeviceType api method calls from client:
        this.ipcMain.on(getExecuteDeviceTypeApiMethodEventName(device.deviceID), (event, methodName: string, executionId: number, ...args: any[]) => {
            const frameId = event.frameId;
            try {
                const result = this.executeDeviceApiCall(device, methodName, executionId, ...args);
                if (result instanceof Promise) {
                    result.then( (v) => {
                        this.window.webContents.sendToFrame(frameId, getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, undefined, v);
                    }).catch( (err) => {
                        this.window.webContents.sendToFrame(frameId, getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, serializeError(err), undefined);
                    });
                } else {
                    this.window.webContents.sendToFrame(frameId, getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, undefined, result);
                }
            } catch (err) {
                _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServer.subscribeDeviceTypeEvents", err);
                this.window.webContents.sendToFrame(frameId, getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, serializeError(err), undefined);
            }
        });
    
    
        // Setup forwarding for all device events:
        DeviceEventsList.forEach((e) => {
            device.on(e as any, ((...args: any[]) => {         
                this.window.webContents.send(getDeviceTypeApiCallabackEventName(e, device.deviceID), ...args);
            }));
        });
    }

    private unsubscribeDeviceTypeEvents(device: DeviceType) {
        this.ipcMain.removeAllListeners(getExecuteDeviceTypeApiMethodEventName(device.deviceID));
        DeviceEventsList.forEach((e) => {
            device.on(e as any, ((...args: any[]) => {
                this.window.webContents.removeAllListeners(getDeviceTypeApiCallabackEventName(e, device.deviceID));
            }));
        });
    }

    private executeJabraApiCall(jabraApi: JabraType,methodName: string,  executionId: number, ...args: any[]) : any {
        _JabraNativeAddonLog(AddonLogSeverity.verbose, "executeJabraApiCall", "Executing " +methodName+ " with execution id " + executionId);
        if (methodName == nameof<JabraType>("disposeAsync")) {
            const shutdownServer = args.length >0 ? !!(args[0]): false
            if (shutdownServer) {
              return this.shutdown();
            } else {
              return Promise.resolve();
            }
        } else {
            return (jabraApi as any)[methodName].apply(jabraApi, args);
        }
    }

    private executeDeviceApiCall(device: DeviceType, methodName: string, executionId: number, ...args: any[]) : any {
        _JabraNativeAddonLog(AddonLogSeverity.verbose, "executeDeviceApiCall", "Executing " +methodName+ " with execution id " + executionId);

        if (device.detached_time_ms) {
            throw new Error("Failed executing method " + methodName + " on detached device with id=" + device.deviceID);
        }

        return (device as any)[methodName].apply(device, args);
    }

    /**
     * Call this when/if finished with the server and the embedded JabraApi.
    */
    public shutdown() : Promise<void> {
        this.ipcMain.removeAllListeners(getExecuteJabraTypeApiMethodEventName());
        this.ipcMain.removeAllListeners(jabraLogEventName);

        if (this.jabraApi) {
            const api = this.jabraApi;
            this.jabraApi = null;

            Array.from(api.getAttachedDevices().values()).forEach((device) => {
                this.unsubscribeDeviceTypeEvents(device);
            });

            return api.disposeAsync().then(() => {
                _JabraNativeAddonLog(AddonLogSeverity.info, "JabraApiServer.shutdown()", "Server shutdown");
            });
        } else {
            return Promise.resolve();
        }
    }
}



