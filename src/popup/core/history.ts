// interface HistoryRecord {
//     id: string;
//     title: string;
//     url: string;
//     lastVisitTime: number;
//     visitCount: number;
// }
interface AttentionRecord {
    history: {
        title: string;
        url: string;
        visitCount: number;
        visitDuration: number;
        lastVisit: number;
    }[];
    bookmarks: string[];
}

export async function getWebsiteVisitDurations() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getWebsiteVisitDurations' }, (response) => {
            const websiteVisitDurations: { [url: string]: number } = response;
            console.log('网站的停留时间：', websiteVisitDurations);
            resolve(websiteVisitDurations);
        });
    });
}

export async function getHistoryRecord(): Promise<chrome.history.HistoryItem[]> {
    return new Promise((resolve) => {
        chrome.history.search(
            {
                text: '',
                startTime: Date.now() - 24 * 60 * 60 * 1000,
            },
            (historyItems) => {
                resolve(historyItems);
            },
        );
    });
}
