import { SystemCall } from '../../types';

import './style.scss';

async function getAttentionRecord(date: string) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            chrome.runtime.id,
            { action: SystemCall.GetAttentionRecord, date },
            (response) => {
                resolve(response);
            },
        );
    });
}

window.addEventListener('message', async (event) => {
    if (event.source === window && event.data.type === 'FROM_INJECTED_SCRIPT') {
        const attentionRecord = await getAttentionRecord(event.data.payload.date);
        window.postMessage({ type: 'FROM_CONTENT_SCRIPT', payload: attentionRecord }, '*');
    }
});

const script = document.createElement('script');
script.textContent = `
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1; // Months are zero-based
        const day = now.getUTCDate();

        return year + '-' + month + '-' + day;
    };

    window.attentionflow = {
        getAttentionRecord: async function (date = getCurrentDate()) {
            window.postMessage({ type: 'FROM_INJECTED_SCRIPT', payload: { date: date } }, '*');
            return new Promise((resolve) => {
                window.addEventListener('message', function (event) {
                    if (event.source === window && event.data.type === 'FROM_CONTENT_SCRIPT') {
                        resolve(event.data.payload);
                    }
                });
            });
        },
    };
`;
(document.head || document.documentElement).appendChild(script);
script.remove();
