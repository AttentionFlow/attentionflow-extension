let startTime: number;
let currentUrl: string | null;
let websiteVisitDurations: { [url: string]: number } = {};

// Event listener for when the extension is opened
chrome.runtime.onStartup.addListener(() => {
    const currentDate = getCurrentDate();
    chrome.storage.local.get(currentDate, (result) => {
        if (result[currentDate]) {
            websiteVisitDurations = result[currentDate];
        }
    });
});

// Event listener for when the browser is closed or the tab is closed
chrome.tabs.onRemoved.addListener(() => {
    stopRecording();
    saveDataToStorage(websiteVisitDurations);
});

// Event listener for when the active tab is changed
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
            stopRecording();
            startRecording(tab.url);
        }
    });
});

// Event listener for when the active tab is updated
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (tab.url) {
            stopRecording();
            startRecording(tab.url);
        }
    }
});

// Timer to check if the current recording interval needs to be saved
setInterval(() => {
    // Check if the current time is past the end of the day in UTC
    const endOfDay = new Date();
    endOfDay.setUTCHours(0, 0, 0, 0);
    endOfDay.setDate(endOfDay.getUTCDate() + 1);

    if (Date.now() >= endOfDay.getTime()) {
        stopRecording();
        saveDataToStorage(websiteVisitDurations);
        // Reset the data for the new day
        websiteVisitDurations = {};
    }
}, 60000); // Run every minute (adjust the interval as needed)

function saveDataToStorage(data: any) {
    chrome.storage.local.set({ [getCurrentDate()]: data });
}

function getCurrentDate(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // Months are zero-based
    const day = now.getUTCDate();

    return `${year}-${month}-${day}`;
}

function startRecording(url: string) {
    currentUrl = url;
    startTime = Date.now();
    if (!websiteVisitDurations[url]) {
        websiteVisitDurations[url] = 0;
    }
}

function stopRecording() {
    if (currentUrl) {
        const elapsedTime = Date.now() - startTime;

        if (websiteVisitDurations[currentUrl]) {
            websiteVisitDurations[currentUrl] += elapsedTime;
        } else {
            websiteVisitDurations[currentUrl] = elapsedTime;
        }
        currentUrl = null;
    }
}

export {};
