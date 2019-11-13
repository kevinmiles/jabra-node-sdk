import { Application } from "spectron";
import * as electronPath from "electron";

import { _JabraNativeAddonLog, AddonLogSeverity } from '@gnaudio/jabra-node-sdk';

test('app runs', (done) => {  
    var app = new Application({
      path: electronPath as any,
      requireName: "electronRequire",
      args: ["./dist/testapp/main/main.js"]
    });

    app.start().then(() => {
        return app.client.waitUntilWindowLoaded(10000);
    }).then(() => {
        // Get visibility + workaround for wrong typing in spectron ts decl:
        const visiblePromise: Promise<boolean> = (app.browserWindow.isVisible()) as any as Promise<boolean>;
        return visiblePromise;
    }).then((isVisible) => {
        // Verify that browser window is shown:
        expect(isVisible).toBe(true);
    }).then(() => {    
        return app.stop();
    }).then(() => {
        done();
    }).catch((error: any) => {
        _JabraNativeAddonLog(AddonLogSeverity.error, __filename, error);
        if (app && app.isRunning()) {
            app.stop().finally(() => {
                done(error);
            })
        } else {
            done(error);
        }
    });
}, 10000);
