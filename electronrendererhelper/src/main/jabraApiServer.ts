
// Browser friendly type-only imports as we can assume the 
// electron app has these types loaded already.
type BrowserWindow = import('electron').BrowserWindow;
type IpcMain = import('electron').IpcMain;

import { isNodeJs, nameof } from '../common/util';

import { getJabraApiMetaSync, createJabraApplication, JabraType, ConfigParamsCloud,
         DeviceEventsList, ClassEntry, DeviceType } from '@gnaudio/jabra-node-sdk';
import { getExecuteDeviceTypeApiMethodEventName, getDeviceTypeApiCallabackEventName, 
         getJabraTypeApiCallabackEventName, getExecuteJabraTypeApiMethodEventName, 
         getExecuteJabraTypeApiMethodResponseEventName, 
         getExecuteDeviceTypeApiMethodResponseEventName,
         createApiClientInitEventName } from '../common/ipc';

/**
 * This factory create the server side Jabra API server that serves events and forwards commands for the
 * corresponding (client side) createApiClient() helper. Creation of the server, is a two-step process.
 * First this factory class must be instantiated BEFORE any window(s) are loaded, secondly after
 * the window(s) has been fully loaded, the factory create method can be called 
 * 
 * Nb. This factory should be created only once.
 */
export class JabraApiServerFactory
{
    private readonly ipcMain: IpcMain;
    private readonly jabraApiMeta: ClassEntry[];

    /**
     * Construct an JabraApiServer factory using a ready ipcMain instance. This constructor should
     * be called BEFORE any GUI is created.
     */
    public constructor(ipcMain: IpcMain) {
        if (!isNodeJs()) {
            throw new Error("This JabraApiServerFactory class needs to run under NodeJs and not in a browser");
        }

        this.ipcMain = ipcMain;
        this.jabraApiMeta = getJabraApiMetaSync();

        this.ipcMain.on(createApiClientInitEventName, (syncEvent) => {
            syncEvent.returnValue = this.jabraApiMeta;
        });
    }

    /**
     * Constructs a Jabra API server object after any GUI is loaded.
     * 
     * Nb. Importantly, the provided window must be fully loaded (use promise returned by electron's loadFile or
     * wait for electron's 'did-finish-load' event) before creating this object !
     * 
     */
    public create(appID: string, configCloudParams: ConfigParamsCloud, fullyLoadedWindow: BrowserWindow) : Promise<JabraApiServer> {
        return JabraApiServer.create(appID, configCloudParams, this.ipcMain, this.jabraApiMeta, fullyLoadedWindow);
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
    private jabraApi: JabraType | null;
    private readonly jabraApiMeta: ClassEntry[];
    private readonly ipcMain: IpcMain;
    private readonly window: BrowserWindow;

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
        this.jabraApiMeta = jabraApiMeta;
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
                        this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, err, undefined);
                    });
                } else {
                    this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, undefined, result);
                }
            } catch (err) {
                this.window.webContents.send(getExecuteJabraTypeApiMethodResponseEventName(), methodName, executionId, err, undefined);
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
                        this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, err, undefined);
                    });
                } else {
                    this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, undefined, result);
                }
            } catch (err) {
                this.window.webContents.send(getExecuteDeviceTypeApiMethodResponseEventName(device.deviceID), methodName, executionId, err, undefined);
            }
        });
    
    
        // Setup forwarding for all device events:
        DeviceEventsList.forEach((e) => {
            device.on(e as any, ((...args: any[]) => {
                this.window.webContents.send(getDeviceTypeApiCallabackEventName(e, device.deviceID), ...arguments);
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

        if (this.jabraApi) {
            const api = this.jabraApi;
            this.jabraApi = null;

            Array.from(api.getAttachedDevices().values()).forEach((device) => {
                this.unsubscribeDeviceTypeEvents(device);
            });

            return api.disposeAsync().then(() => {
              // console.log("API Now shutdown");
            });
        } else {
            return Promise.resolve();
        }
    }
}


