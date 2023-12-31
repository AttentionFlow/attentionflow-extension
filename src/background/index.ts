import { AttentionRecord, Bookmark, History, SystemCall } from '../types';
import { getCategoryFromUrl, getCurrentDate, getLocalStorage, setLocalStorage } from '../utils';

let startTime: number;
let currentUrl: string;
let historyRecord: { [url: string]: History } = {};
let bookmarkRecord: Bookmark[] = [];

const saveDataToStorage = async (type: 'history' | 'bookmarks') => {
    const currentDate = getCurrentDate();

    const result = await getLocalStorage(currentDate);
    if (type === 'history') {
        const currentDateData = {
            history: historyRecord,
            bookmarks: (result[currentDate] && result[currentDate]['bookmarks']) ?? [],
        };
        await setLocalStorage(currentDate, currentDateData);
    } else {
        const currentDateData = {
            history: (result[currentDate] && result[currentDate]['history']) ?? {},
            bookmarks: bookmarkRecord,
        };
        await setLocalStorage(currentDate, currentDateData);
    }
};

function startRecording(url: string, isContinue: boolean = false) {
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
        if (!isContinue) {
            historyRecord[url].visitCount++;
        }
    }
}

function stopRecording() {
    if (!currentUrl) {
        return;
    }
    const elapsedTime = Date.now() - startTime;

    if (historyRecord[currentUrl]) {
        historyRecord[currentUrl].visitDuration += elapsedTime;
    } else {
        historyRecord[currentUrl].visitDuration = elapsedTime;
    }
    historyRecord[currentUrl].lastVisit = Date.now();
}

// Listen for messages from the web page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === SystemCall.GetAttentionRecord) {
        if (message.date === getCurrentDate()) {
            stopRecording();

            saveDataToStorage('history')
                .then(function () {
                    return saveDataToStorage('bookmarks');
                })
                .then(function () {
                    if (currentUrl) {
                        startRecording(currentUrl, true);
                    }
                })
                .then(function () {
                    return getLocalStorage(message.date);
                })
                .then(function (result) {
                    if (result[message.date]) {
                        let _historyRecord: History[] = [];
                        if (result[message.date]['history']) {
                            _historyRecord = Object.values(result[message.date]['history']);
                        }
                        let _bookmarkRecord: Bookmark[] = [];
                        if (result[message.date]['bookmarks']) {
                            _bookmarkRecord = result[message.date]['bookmarks'];
                        }
                        const attentionRecord: AttentionRecord = {
                            history: _historyRecord,
                            bookmarks: _bookmarkRecord,
                        };
                        console.log(`response ${message.date}:`, attentionRecord);
                        sendResponse(attentionRecord);
                    } else {
                        sendResponse();
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    sendResponse({
                        error: 'Error occurred',
                    });
                });
        } else {
            getLocalStorage(message.date).then((result) => {
                if (result[message.date]) {
                    const _historyRecord = Object.values(
                        result[message.date]['history'],
                    ) as History[];
                    const _bookmarkRecord = result[message.date]['bookmarks'] as Bookmark[];
                    const attentionRecord: AttentionRecord = {
                        history: _historyRecord,
                        bookmarks: _bookmarkRecord,
                    };
                    console.log(`response ${message.date}:`, attentionRecord);
                    sendResponse(attentionRecord);
                } else {
                    sendResponse();
                }
            });
        }
    } else {
        sendResponse();
    }
    return true;
});

// Event listener for when the extension is opened
chrome.runtime.onStartup.addListener(async () => {
    const currentDate = getCurrentDate();
    const result = await getLocalStorage(currentDate);
    if (result[currentDate]) {
        historyRecord = result[currentDate]['history'];
        bookmarkRecord = result[currentDate]['bookmarks'];
        console.log('onStartup:', {
            historyRecord,
            bookmarkRecord,
        });
    }
});

// Event listener for when the browser is closed or the tab is closed
chrome.tabs.onRemoved.addListener(async () => {
    stopRecording();
    saveDataToStorage('history');
    saveDataToStorage('bookmarks');
    console.log('Tabs onRemoved:', { historyRecord, bookmarkRecord });
});

// Event listener for when the active tab is changed
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
            stopRecording();
            startRecording(tab.url);
            console.log('Tabs onActived:', { historyRecord });
        }
    });
});

// Event listener for when the active tab is updated
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (tab.url) {
            stopRecording();
            startRecording(tab.url);
            console.log('Tabs onUpdated:', { historyRecord });
        }
    }
});

// Event listener for when a bookmark is created
chrome.bookmarks.onCreated.addListener((_, createInfo) => {
    if (!createInfo.url) {
        return;
    }
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
            console.log('Bookmarks onCreated:', { bookmarkRecord });
        });
    } else {
        bookmarkRecord.push({
            title: createInfo.title,
            url: createInfo.url,
            category: getCategoryFromUrl(createInfo.url),
            addedAt: createInfo.dateAdded,
        });
        console.log('Bookmarks onCreated:', { bookmarkRecord });
    }
});

// Event listener for when a bookmark is removed
chrome.bookmarks.onRemoved.addListener((_, removeInfo) => {
    bookmarkRecord = bookmarkRecord.filter(
        (bookmarkInfo) => bookmarkInfo.url !== removeInfo.node.url,
    );
    console.log('Bookmarks onRemoved:', { bookmarkRecord });
});

// Event listener for when a bookmark is changed
chrome.bookmarks.onChanged.addListener((_, changeInfo) => {
    const index = bookmarkRecord.findIndex((bookmarkInfo) => bookmarkInfo.url === changeInfo.url);
    if (index != -1) {
        bookmarkRecord[index].title = changeInfo.title;
        console.log('Bookmarks onChanged:', { bookmarkRecord });
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
                    console.log('Bookmarks onMoved:', { bookmarkRecord });
                });
            }
        }
    });
});

// Timer run every minute to check if the current recording interval needs to be saved
setInterval(async () => {
    // Check if the current time is past the end of the day in UTC
    const endOfDay = new Date();
    endOfDay.setUTCHours(0, 0, 0, 0);
    endOfDay.setDate(endOfDay.getUTCDate() + 1);

    if (Date.now() >= endOfDay.getTime()) {
        stopRecording();
        await saveDataToStorage('history');
        await saveDataToStorage('bookmarks');
        console.log('End of day:', { historyRecord, bookmarkRecord });
        historyRecord = {};
        bookmarkRecord = [];
        if (currentUrl) {
            startRecording(currentUrl);
        }
    }
}, 60000);
