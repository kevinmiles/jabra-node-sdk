// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import { ipcRenderer } from 'electron';

// We can't import anything but electron core stuff like ipcRenderer
// so for now redelare it here.
function isRunningInTestMode() : boolean
{
    return (process.env.NODE_ENV === 'test') 
}

console.log('preload.js loaded with testMode = "' + isRunningInTestMode() + '"');

window.electron = { 
    ipcRenderer
};

// Special export for spectron tests.
if (isRunningInTestMode()) {
    window.electronRequire = require
}


