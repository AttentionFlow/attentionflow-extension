import { AttentionRecord, Bookmark, History, SystemCall } from '../types';
import { getCurrentDate } from '../utils';

let startTime: number;
let currentUrl: string | undefined;
let historyRecord: { [url: string]: History } = {};
let bookmarkRecord: Bookmark[] = [];

// Listen for messages from the web page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === SystemCall.GetAttentionRecord) {
        chrome.storage.local.get(message.date, (result) => {
            if (result[message.date]) {
                const historyRecord = Object.values(result[message.date]['history']) as History[];
                const bookmarkRecord = result[message.date]['bookmarks'] as Bookmark[];
                const attentionRecord: AttentionRecord = {
                    history: historyRecord,
                    bookmarks: bookmarkRecord,
                };
                sendResponse(attentionRecord);
            } else {
                sendResponse({
                    error: 'Not Found',
                });
            }
        });
    }
});

// Event listener for when the extension is opened
chrome.runtime.onStartup.addListener(() => {
    const currentDate = getCurrentDate();
    chrome.storage.local.get(currentDate, (result) => {
        if (result[currentDate]) {
            historyRecord = result[currentDate]['history'];
            bookmarkRecord = result[currentDate]['bookmarks'];
        }
    });
});

// Event listener for when the browser is closed or the tab is closed
chrome.tabs.onRemoved.addListener(() => {
    stopRecording();
    saveDataToStorage('history');
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

// Event listener for when a bookmark is created
chrome.bookmarks.onCreated.addListener((_, bookmark) => {
    bookmarkRecord.push({
        title: bookmark.title,
        url: bookmark.url,
        addedAt: bookmark.dateAdded,
    });
    saveDataToStorage('bookmarks');
});

// Timer to check if the current recording interval needs to be saved
setInterval(() => {
    // Check if the current time is past the end of the day in UTC
    const endOfDay = new Date();
    endOfDay.setUTCHours(0, 0, 0, 0);
    endOfDay.setDate(endOfDay.getUTCDate() + 1);

    if (Date.now() >= endOfDay.getTime()) {
        stopRecording();
        saveDataToStorage('history');
        historyRecord = {}; // Reset the data for the new day
        bookmarkRecord = [];
    }
}, 60000); // Run every minute (adjust the interval as needed)

function saveDataToStorage(type: 'history' | 'bookmarks') {
    const currentDate = getCurrentDate();
    let currentDateData;

    chrome.storage.local.get(currentDate, (result) => {
        if (type === 'history') {
            currentDateData = {
                history: historyRecord,
                ...result[currentDate],
            };
        } else {
            currentDateData = {
                bookmarks: bookmarkRecord,
                ...result[currentDate],
            };
        }
        chrome.storage.local.set({ [currentDate]: currentDateData });
    });
}

function startRecording(url: string) {
    currentUrl = url;
    startTime = Date.now();
    if (!historyRecord[url]) {
        historyRecord[url] = {
            url,
            visitDuration: 0,
            visitCount: 1,
        };
    } else {
        historyRecord[url].visitCount++;
    }
}

function stopRecording() {
    if (currentUrl) {
        const elapsedTime = Date.now() - startTime;

        if (historyRecord[currentUrl]) {
            historyRecord[currentUrl].visitDuration += elapsedTime;
        } else {
            historyRecord[currentUrl].visitDuration = elapsedTime;
        }
        historyRecord[currentUrl].lastVisit = Date.now();
        currentUrl = undefined;
    }
}
