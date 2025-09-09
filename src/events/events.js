import { closeEventLoading, openEventLoading, toggleNotification } from "../views/pages";

let currentEvents = [];
let isProcessingEvent = false;

export async function appendEvent(name, event, icon = null) {
    if (!name || !event || typeof event !== 'function'){
        return Promise.reject(new Error('The event parameters are missing'));
    }
    console.log("Added event : " + name);
    let eventPromise = new Promise((resolve, reject) => {
        currentEvents.push({
            name: name, 
            event: event,
            icon: icon,
            resolve: resolve,
            reject: reject
        });
    });
    processEvent();
    return eventPromise;
    /*if (!name || !event){
        toggleNotification('error', 'The event parameters are missing', 'signal_disconnected');
        return;
    }

    
    currentEvents.push({
        name: name, 
        event: event,
        icon: icon
    });
    const eventResult = await triggerEvent();
    console.log("Finished Event: " + name);
    await triggerEvent();
    return eventResult;*/
}

async function processEvent() {
    if (isProcessingEvent === true)
        return;

    if (currentEvents.length === 0) {
        console.log('[#] No events left to process.');
        closeEventLoading();
        return;
    }

    isProcessingEvent = true;
    while (currentEvents.length > 0){
        const currentEvent = currentEvents.shift();
        if (!currentEvent || !currentEvent.event || typeof(currentEvent.event) !== 'function' || !currentEvent.resolve || !currentEvent.reject){
            console.error('[#] Invalid event in queue founded: Skipping', currentEvent);
            if (currentEvent && currentEvent.reject){
                currentEvent.reject(new Error('Invalid event in queue founded: Skipping'));
            }
            continue;
        }
        console.log('[#] Triggering Event: ' + currentEvent.name);
        openEventLoading(currentEvent.name, currentEvent.icon);
        try {
            console.log("Got Here");
            const eventResult = await currentEvent.event();
            currentEvent.resolve(eventResult);
        }
        catch (error) {
            console.error("Error during event execution (" + currentEvent.name + "):", error);
            currentEvent.reject(error);
        }
        finally {
            console.log("[#] Event finished: " + currentEvent.name);
        }
    }

    isProcessingEvent = false;
    console.log("Queue processing finished.");
    closeEventLoading();

    /*if (isProcessingEvent === true)
        return;
    isProcessingEvent = true;
    while (currentEvents.length > 0){
        const currentEvent = currentEvents.shift();
        openEventLoading(currentEvent.name, currentEvent.icon);
        console.log("[#] Triggering Event: " + currentEvent.name);
        try {
            await currentEvent.event();
        }
        catch (error) {
            console.log("There is something wrong with the event queue processing...", currentEvent.name, error);
        }
    }
    isProcessingEvent = false;
    console.log("No events left to process.");
    closeEventLoading();*/
}

/*async function triggerEvent(){
    if (runningEventName !== null)
    {
        console.log("No Event Left I -> " + runningEventName);
        return null;
    }

    if (currentEvents.length === 0){
        console.log("No Event Left II");
        closeEventLoading();
        return null;
    }

    const currentEvent = currentEvents.shift();
    runningEventName = currentEvent.name;
    openEventLoading(currentEvent.name, currentEvent.icon);
    if (currentEvent === undefined || currentEvent.event === undefined)
        return null;

    
    const eventResult = await currentEvent.event();
    console.log(eventResult);
    runningEventName = null;
    console.log("Running Event: " + runningEventName);
    return eventResult;
}*/

export function remainingEventCount() {
    return currentEvents.length + (isProcessingEvent ? 1 : 0);
}