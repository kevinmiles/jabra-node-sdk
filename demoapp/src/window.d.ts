
interface Window {
    /** 
     * Contains electron extras supplied by our preload.ts
    */
    electron: {
        // Instance of ipcRenderer (http://electronjs.org/docs/api/ipc-renderer) assigned here by preloading.
        ipcRenderer: any;
    }
}