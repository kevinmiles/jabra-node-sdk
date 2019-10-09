
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
         createApiClientInitEventName, jabraLogEventName, ApiClientInitEventData } from '../common/ipc';

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
                // Serve configuration data to client api (or error if failed to init):
                this.ipcMain.on(createApiClientInitEventName, (syncEvent) => {
                    _JabraNativeAddonLog(AddonLogSeverity.info, "JabraApiServerFactory.constructor", "Jabra meta data requested by createApiClient");
                    syncEvent.returnValue = serializeError(this.startupError) || <ApiClientInitEventData>{
                        logConfig: this.jabraNativeAddonLogConfig,
                        apiMeta: this.jabraApiMeta
                    };
                });

                // Log any string (!) messages received:
                this.ipcMain.on(jabraLogEventName, (event, severity: AddonLogSeverity, caller: string, msg: string) => {
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
            let server = JabraApiServer.create(appID, configCloudParams, this.ipcMain, this.jabraApiMeta, fullyLoadedWindow);
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
    public static create(appID: string, configCloudParams: ConfigParamsCloud, ipcMain: IpcMain, jabraApiMeta: ClassEntry[], window: BrowserWindow) : Promise<JabraApiServer> {
        return createJabraApplication(appID, configCloudParams).then( (jabraApi) => {
            const server = new JabraApiServer(jabraApi, ipcMain, jabraApiMeta, window);
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

    private constructor(jabraApi: JabraType, ipcMain: IpcMain, jabraApiMeta: ClassEntry[], window: BrowserWindow) {
        this.jabraApi = jabraApi;
        this.ipcMain = ipcMain;
        this.window = window;

        this.setupJabraEvents(jabraApi);
        this.setupElectonEvents(jabraApi);
    }

    private setupJabraEvents(jabraApi: JabraType) {
        jabraApi.on('attach', (device) => {
            // Filter out internal data structures when forwarding data:
            let deviceData = Object.keys(device).filter(key => !key.startsWith("_")).reduce((obj, key) => {
                return {
                ...obj,
                [key]: (device as any)[key]
                };
            }, {});
      
           
            this.subscribeDeviceTypeEvents(device);
        
            this.window.webContents.send(getJabraTypeApiCallabackEventName('attach'), deviceData);
          });
      
        jabraApi.on('detach', (device) => {
            // Filter out internal data structures when forwarding data:
            let deviceData = Object.keys(device).filter(key => !key.startsWith("_")).reduce((obj, key) => {
              return {
                ...obj,
                [key]: (device as any)[key]
              };
            }, {});

            this.unsubscribeDeviceTypeEvents(device);

            this.window.webContents.send(getJabraTypeApiCallabackEventName('detach'), deviceData);
        });
      
        jabraApi.on('firstScanDone', () => {     
            this.window.webContents.send(getJabraTypeApiCallabackEventName('firstScanDone'));
        });
    }

    private setupElectonEvents(jabraApi: JabraType) {
        this.ipcMain.on(getExecuteJabraTypeApiMethodEventName(), (event, methodName: string, executionId: number, ...args: any[]) => {
            try {
                let result = this.executeJabraApiCall(jabraApi, methodName, ...args);
                if (result instanceof Promise) {
                    result.then( (v) => {
                        this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, undefined, v);
                    }).catch( (err) => {
                        this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, serializeError(err), undefined);
                    });
                } else {
                    this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, undefined, result);
                }
            } catch (err) {
                _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServer.setupElectonEvents", err);
                this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, serializeError(err), undefined);
            }
        });
    }

    private subscribeDeviceTypeEvents(device: DeviceType) {
        this.ipcMain.on(getExecuteDeviceTypeApiMethodEventName(device.deviceID), (event, methodName: string, executionId: number, ...args: any[]) => {
            try {
                let result = this.executeDeviceApiCall(device, methodName, ...args);
                if (result instanceof Promise) {
                    result.then( (v) => {
                        this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, undefined, v);
                    }).catch( (err) => {
                        this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, serializeError(err), undefined);
                    });
                } else {
                    this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, undefined, result);
                }
            } catch (err) {
                _JabraNativeAddonLog(AddonLogSeverity.error, "JabraApiServer.subscribeDeviceTypeEvents", err);
                this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, serializeError(err), undefined);
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

    private executeJabraApiCall(jabraApi: JabraType, methodName: string, ...args: any[]) : any {
        if (methodName == nameof<JabraType>("disposeAsync")) {
            return this.shutdown();
        } else {
            return (jabraApi as any)[methodName].apply(jabraApi, args);
        }
    }

    private executeDeviceApiCall(device: DeviceType, methodName: string, ...args: any[]) : any {
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



