import { JabraTypeEvents, DeviceTypeEvents, NativeAddonLogConfig, ClassEntry } from '@gnaudio/jabra-node-sdk';

/**
 * The configuration/meta data returned to clients once server is ready.
 */
export interface ApiClientInitEventData {
    logConfig: NativeAddonLogConfig;
    apiMeta: ReadonlyArray<ClassEntry>;
};

/**
 * A serialized error is just an object that is json friendly.
 */
export type SerializedError = object;

/**
 * Type for saved responses in init response queue.
 */
export type ApiClientIntResponse = {
    frameId: number;
    response: SerializedError | ApiClientInitEventData;
}

/**
 * Send when the client is initializing asking the Api server for meta data when ready.
 */
export const createApiClientInitEventName = "jabraApiClientIntializing";

/**
 * Send when the server is ready along with meta data for the client
 */
export const createApiClientInitResponseEventName = "jabraApiClientIntializingResponse";

/**
 * Send when the client wants to log something to the native Jabra Log.
 */
export const jabraLogEventName = "jabraApiClientLog";

/**
 * Send when the client is ready and wants to receive any prior attach events.
 * Nb. This event might be missed by the server if the client is ready before
 * the server is. This should not be a problem though as there should then
 * be no prior attach events to resend.
 */
export const jabraApiClientReadyEventName  = "jabraApiClientReadyEventName";

/**
 * Event channel name for executing methods against a specific device.
 */
export function getExecuteDeviceTypeApiMethodEventName(deviceID: number) {
    return 'executeDeviceApiMethod:' + deviceID.toString();
}

/**
 * Event channel name for responding with results to executing methods against a specific device.
 */
export function getExecuteDeviceTypeApiMethodResponseEventName(deviceID: number) {
    return 'executeDeviceApiMethodResponse:' + deviceID.toString();
}

/**
 * Event channel name for receiving events for a specific device.
 */
export function getDeviceTypeApiCallabackEventName(eventName: DeviceTypeEvents, deviceID: number) {
    return eventName + ':' + deviceID.toString();
}

/**
 * Event channel name for executing general methods on the jabra sdk (not device specific).
 */
export function getExecuteJabraTypeApiMethodEventName() {
    return 'executeJabraApiMethod';
}

/**
 * Event channel name for responding with results to executing methods on the jabra sdk (not device specific).
 */
export function getExecuteJabraTypeApiMethodResponseEventName() {
    return 'executeJabraApiMethodResponse';
}

/**
 * Event channel name for receiving general (not device specific) jabra sdk events.
 */
export function getJabraTypeApiCallabackEventName(eventName: JabraTypeEvents) {
    return eventName;
}

