// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import { ipcRenderer } from 'electron';
import { isRunningInTestMode } from '../common/util';

console.log('preload.js loaded with testMode = "' + isRunningInTestMode() + '"');

window.electron = { 
    ipcRenderer
};

// Special export for spectron tests.
if (isRunningInTestMode()) {
    window.electronRequire = require
}


