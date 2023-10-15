import { AttentionRecord, Bookmark, History, SystemCall } from '../types';
import { getCategoryFromUrl, getCurrentDate } from '../utils';

let startTime: number;
let currentUrl: string | undefined;
let historyRecord: { [url: string]: History } = {};
let bookmarkRecord: Bookmark[] = [];

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
            category: getCategoryFromUrl(url),
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
    saveDataToStorage('bookmarks');
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
chrome.bookmarks.onCreated.addListener((_, createInfo) => {
    if (createInfo.parentId) {
        chrome.bookmarks.get(createInfo.parentId, (result) => {
            const folder = result[0].title;
            bookmarkRecord.push({
                title: createInfo.title,
                url: createInfo.url,
                category: getCategoryFromUrl(createInfo.url),
                addedAt: createInfo.dateAdded,
                folder,
            });
        });
    } else {
        bookmarkRecord.push({
            title: createInfo.title,
            url: createInfo.url,
            category: getCategoryFromUrl(createInfo.url),
            addedAt: createInfo.dateAdded,
        });
    }
});

// Event listener for when a bookmark is removed
chrome.bookmarks.onRemoved.addListener((_, removeInfo) => {
    bookmarkRecord = bookmarkRecord.filter(
        (bookmarkInfo) => bookmarkInfo.url !== removeInfo.node.url,
    );
});

// Event listener for when a bookmark is changed
chrome.bookmarks.onChanged.addListener((_, changeInfo) => {
    const index = bookmarkRecord.findIndex((bookmarkInfo) => bookmarkInfo.url === changeInfo.url);
    if (index != -1) {
        bookmarkRecord[index].title = changeInfo.title;
    }
});

// Event listener for when a bookmark is moved
chrome.bookmarks.onMoved.addListener((_, moveInfo) => {
    chrome.bookmarks.getSubTree(moveInfo.parentId, (result) => {
        if (
            result &&
            result.length > 0 &&
            result[0].children &&
            result[0].children.length > moveInfo.index
        ) {
            const bookmark = result[0].children[moveInfo.index];

            const index = bookmarkRecord.findIndex(
                (bookmarkInfo) => bookmarkInfo.url === bookmark.url,
            );
            if (index != -1) {
                chrome.bookmarks.get(moveInfo.parentId, (result) => {
                    const folder = result[0].title;
                    bookmarkRecord[index].folder = folder;
                });
            }
        }
    });
});

// Timer run every minute to check if the current recording interval needs to be saved
setInterval(() => {
    // Check if the current time is past the end of the day in UTC
    const endOfDay = new Date();
    endOfDay.setUTCHours(0, 0, 0, 0);
    endOfDay.setDate(endOfDay.getUTCDate() + 1);

    if (Date.now() >= endOfDay.getTime()) {
        stopRecording();
        saveDataToStorage('history');
        saveDataToStorage('bookmarks');
        historyRecord = {};
        bookmarkRecord = [];
    }
}, 60000);
