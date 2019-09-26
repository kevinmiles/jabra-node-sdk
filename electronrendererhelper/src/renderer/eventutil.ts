import { JabraType, DeviceType, JabraEventsList, DeviceEventsList } from "@gnaudio/jabra-node-sdk";

/**
 * Internal helper that returns an array of valid event keys that correspond to the event specificator and are known to exist.
 */
function getEvents<T extends string>(nameSpec: string | RegExp | Array<string | RegExp>, eventList: ReadonlyArray<T>): ReadonlyArray<T> {
    if (Array.isArray(nameSpec)) {
        // @ts-ignore: Disable wrong "argument not assignable" error in ts 3.4
        return [ ...new Set<string>([].concat.apply([], nameSpec.map(a => this.getEvents(a, eventList)))) ];
    } else if (nameSpec instanceof RegExp) {
        return Array.from<T>(eventList).filter(key => nameSpec.test(key))
    } else { // String
        if (eventList.includes(nameSpec as T)) {
            return [ nameSpec as T ];
        } else {
            console.warn("Unknown event " + nameSpec + " ignored when adding/removing eventlistener");
        }
    }

    return [];
}

export function multiOn(apiObject: JabraType | DeviceType, nameSpec: string | RegExp | Array<string | RegExp>, callback: (...args: any[]) => void): void {
    if (apiObject instanceof  JabraType) {
        getEvents(nameSpec, JabraEventsList).map(name => {
            apiObject.on(name as any, callback);
        });
    } else if (apiObject instanceof DeviceType)  {
        getEvents(nameSpec, DeviceEventsList).map(name => {
            apiObject.on(name as any, callback);
        });
    }
};
