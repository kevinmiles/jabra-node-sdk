import { Application } from "spectron";
import * as electronPath from "electron";

import { _JabraNativeAddonLog, AddonLogSeverity } from '@gnaudio/jabra-node-sdk';

const startupTimeout = 10000;

var app: Application | null;

beforeEach((done) => {
    app = new Application({
        path: electronPath as any,
        requireName: "electronRequire",
        args: ["./dist/testapp/main/main.js"]
    });

    app.start().then(() => {
        return app!.client.waitUntilWindowLoaded(startupTimeout);
    }).then(() => {
        // Get visibility + workaround for wrong typing in spectron ts decl:
        return (app!.browserWindow.isVisible()) as any as Promise<boolean>;
    }).then((v) => {
        if (v)
            done();
        else done(new Error("Window not visible"));
    }).catch((err) => {
        _JabraNativeAddonLog(AddonLogSeverity.error, __filename, err);
    });
}, startupTimeout);
  
afterEach((done) => {
    if (app && app.isRunning()) {
        app.stop().finally(() => {
            app = null;
            done();
        })
    } else {
        app = null;
        done();
    }
});

test('app runs', (done) => {
    return app!.client.getWindowCount().then((count) => {
        expect(count).toBe(1);
        done();
    }).catch((err) =>  {
        done(err);
    });
}, 10000);
