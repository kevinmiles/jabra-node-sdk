Jabra Node.js SDK - BETA RELEASE

# Table of Contents
- [Pre-requisite](#pre-requisite)
- [Installation](#installation)
- [Debugging and Logging](#debugging-and-logging)
- [API Reference](#api-reference)
- [Examples](#examples)
    - [Simple Example](#simple-example)
    - [Multiple device management](#multiple-device-management)
- [Supported devices](#supported-devices)
- [Bug report](../readme#bug-reports)
- [Changelog](../changelog)
- [License](../license)

**Warning: ALL software released here is in BETA. All software can be considered unstable, possibly untested and might be updated at any time. In addition, this documentation is not fully updated. Use at your own risk. If you want to use something stable, please await completion of our development and Q/A process OR consider using our previous ["jabra" npm](https://www.npmjs.com/package/jabra) package (util it will be deprecated at a later stage).**

## Pre-requisite
1. Node.js v8.x or later && `node-gyp`.
2. **On MacOS:** `xcode` & `python 2.7`. By default, Python is installed on macOS but make sure correct version(2.7.x) is installed. Install Xcode from App store or download it from [here](https://developer.apple.com/xcode/download/).
3. **On Windows:** `Visual C++ Build Tools` & `Python 2.7`. You can install all of these using command `npm install --global --production --add-python-to-path windows-build-tools`. To know more about this tool, see [this link.](https://github.com/felixrieseberg/windows-build-tools)
4. **On Linux:** `build-essential` package for C++ compilation &  & `Python 2.7`.

5. **For Electron.JS:** If you are using `asar` packaging then you may need to `unpack` some of the resources used in this module. These resources are native library files i.e `libjabra.dll`, `libjabra.dylib` & `libjabra.so`, which is stored in a `build\Release` folder. By default latest electron builder will automatically unpack, but if it does not work then you can provide below option to your build process. To know more, see [this link](https://www.electron.build/configuration/configuration)

    ```
    "build": {
        "asarUnpack": ["node_modules/@gnaudio/jabra-node-sdk"]
    }
    ```

## Installation
This release is published to npm and can be installed via below command.
```
npm install --save @gnaudio/jabra-node-sdk
```

## Debugging and Logging
Below environment variables are defined for logging and debugging purpose. User can change the values as per preference.

Environment Variable | Value | Description
--- | --- | ---
LIBJABRA_TRACE_LEVEL | fatal, error, warning(default), info, debug | Log levels
LIBJABRA_RESOURCE_PATH | **On Mac:** ~/Library/Application Support/JabraSDK/ **On Windows:** %appdata%/JabraSDK  | This determine the system path where logs and device related files are written.

## API Reference
API doc is in html format. See doc folder inside installed module `node_module/jabra/doc` and open `index.html`.

## Examples

For all examples, user should first register the app on [Jabra developer site](https://developer.jabra.com/) to get appID. User should pass this appID to `createJabraApplication` in order to initialize the jabra module:

### Simple button events example using javascript and plain promises

```javascript
const j = require("jabra-dev");
j.createJabraApplication('123').then((jabra) => { //123 is appID here
    jabra.on('attach', (device) => {
        console.log('Press any key on Jabra device ' + device.deviceName);
        device.on('btnPress', (btnType, btnValue) => {
          console.log('New input from device is received: ', j.enumDeviceBtnType[btnType], btnValue);
        });
    });    
});
```

### Simple button events example using typescript and plain promises

```typescript
import { createJabraApplication, enumDeviceBtnType } from '../main/index';
createJabraApplication('123').then((jabra) => { //123 is appID here
    jabra.on('attach', (device) => {
        console.log('Press any key on Jabra device ' + device.deviceName);
        device.on('btnPress', (btnType, btnValue) => {
          console.log('New input from device is received: ', enumDeviceBtnType[btnType], btnValue);
        });
    });    
});
```

### Ring example using typescript and plain promises
This example shows how to ring a Jabra device.

```typescript
import { createJabraApplication } from 'jabra-dev';

createJabraApplication('123').then((jabra) => { //123 is appID here
    jabra.on('attach', (device) => {
        device.isRingerSupportedAsync().then( (supported) => {
            if (supported) {
              device.offhookAsync().then ( () => {
                console.log("ringing");
              }).catch ((err) => {
                console.log("ring failed with error " + err);
              }); //ring the device
              setTimeout(() => {
                device.unringAsync().then(() => {
                    console.log("stopped ringing");
                }).catch ((err) => {
                    console.log("unring failed with error " + err);
                });
              }, 5000); //stop ringing the device after 5 second
            }          
        }).catch( (err) => {
            console.error('Jabra call failed with error ' + err)
        });
    });
    
    jabra.on('detach', (device) => {
        console.log('Device detached with deviceID:', device.deviceID);

        // In this demo example, we will auto shutdown once all jabra devices are removed:
        let remainingAttachedDevices = jabra.getAttachedDevices();
        if (remainingAttachedDevices.size == 0) {
            jabra.disposeAsync().then (() => {}); // Cleanup and allow node process to exit.
        }
    });
});
```

### Multiple device management with typescript and async/await

```typescript
import { createJabraApplication } from 'jabra-dev';

(async () => {
    let jabra = await createJabraApplication('123'); //123 is appID here

    let deviceIDList: number[] = [];

    jabra.on('attach', (device) => {
        deviceIDList.push(device.deviceID);
    });
    
    jabra.on('detach', (device) => {
        //logic to remove this deviceID from deviceIDList array
    })

    await jabra.scanForDevicesDoneAsync(); // Wait for all pre-attached devices to be scanned.

    // suppose at some time, deviceIDList = [1, 3, 5]

    const deviceInstanceList = jabra.getAttachedDevices(); //returns the list(Map data structure) of devices
    if (deviceInstanceList.size!=2) {
        throw new Error("Please make sure two jabra devices are attached");
    }

    const device3 = deviceInstanceList.get(deviceIDList[1])!; //get device instance whose deviceID=3
    await device3.ringAsync(); //ring device3

    const device1 = deviceInstanceList.get(deviceIDList[0])!; //get device instance whose deviceID=1
    await device1.ringAsync(); //ring device1

    // Disponse jabra sdk to enable node process to shutdown.
    await jabra.disposeAsync();
})();
```

## Supported devices
 
 * PRO 9470, PRO 9460, PRO 9450, Biz 2300, Motion Office, Evolve 65 USB, Biz 2400 II CC, PRO 930, PRO 935 (single and dual), PRO 925 (single and dual), Evolve 40 /80, Link 265, Evolve 30 ||, 
 Evolve 20, Biz 1500, Biz 2400 II, Evolve 30, Link 260, Evolve 75
 * Motion UC (Over BT)
 * Link 360, Link 370
 * Speak 410, Speak 510, Speak 710, Speak 810
 * More devices are being added
