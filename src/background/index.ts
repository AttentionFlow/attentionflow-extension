import { AttentionRecord, Bookmark, History, SystemCall } from '../types';
import { getCategoryFromUrl, getCurrentDate, getLocalStorage, setLocalStorage } from '../utils';

let startTime: number;
let currentUrl: string | undefined;
let historyRecord: { [url: string]: History } = {};
let bookmarkRecord: Bookmark[] = [];

const saveDataToStorage = async (type: 'history' | 'bookmarks') => {
    const currentDate = getCurrentDate();

    const result = await getLocalStorage(currentDate);
    if (type === 'history') {
        const currentDateData = {
            history: JSON.parse(JSON.stringify(historyRecord)),
            bookmarks: result[currentDate].bookmarks,
        };
        await setLocalStorage(currentDate, currentDateData);
    } else {
        const currentDateData = {
            history: result[currentDate].history,
            bookmarks: bookmarkRecord,
        };
        await setLocalStorage(currentDate, currentDateData);
    }
};

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
// chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
//     console.log('message received:', message);
//     if (message.action === SystemCall.GetAttentionRecord) {
//         if (message.date === getCurrentDate()) {
//             let _currentUrl = currentUrl;
//             if(_currentUrl) {
//                 stopRecording();
//             }
//             await saveDataToStorage('history');
//             await saveDataToStorage('bookmarks');
//             if(_currentUrl) {
//                 startRecording(_currentUrl);
//             }
//         }

//         const result = await getLocalStorage(message.date);
//         if (result[message.date]) {
//             const _historyRecord = Object.values(result[message.date]['history']) as History[];
//             const _bookmarkRecord = result[message.date]['bookmarks'] as Bookmark[];
//             const attentionRecord: AttentionRecord = {
//                 history: _historyRecord,
//                 bookmarks: _bookmarkRecord,
//             };
//             console.log("response:", attentionRecord);
//             sendResponse(attentionRecord);
//         } else {
//             sendResponse({
//                 error: 'Not Found',
//             });
//         }
//     }
// });
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === SystemCall.GetAttentionRecord) {
        if (message.date === getCurrentDate()) {
            let _currentUrl = currentUrl;
            if (_currentUrl) {
                stopRecording();
            }
            saveDataToStorage('history')
                .then(function () {
                    return saveDataToStorage('bookmarks');
                })
                .then(function () {
                    if (_currentUrl) {
                        startRecording(_currentUrl);
                    }
                })
                .then(function () {
                    return getLocalStorage(message.date);
                })
                .then(function (result) {
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
    console.log('on startup,result:', result);
    if (result[currentDate]) {
        historyRecord = result[currentDate]['history'];
        bookmarkRecord = result[currentDate]['bookmarks'];
    }
});

// Event listener for when the browser is closed or the tab is closed
chrome.tabs.onRemoved.addListener(async () => {
    stopRecording();
    saveDataToStorage('history');
    saveDataToStorage('bookmarks');
    console.log('onRemoved:', { historyRecord });
});

// Event listener for when the active tab is changed
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
            stopRecording();
            startRecording(tab.url);
            console.log('onActived:', { historyRecord });
        }
    });
});

// Event listener for when the active tab is updated
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (tab.url) {
            stopRecording();
            startRecording(tab.url);
            console.log('onUpdated:', { historyRecord });
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
setInterval(async () => {
    // Check if the current time is past the end of the day in UTC
    const endOfDay = new Date();
    endOfDay.setUTCHours(0, 0, 0, 0);
    endOfDay.setDate(endOfDay.getUTCDate() + 1);

    if (Date.now() >= endOfDay.getTime()) {
        stopRecording();
        await saveDataToStorage('history');
        await saveDataToStorage('bookmarks');
        historyRecord = {};
        bookmarkRecord = [];
    }
}, 60000);
