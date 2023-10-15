import { WebsiteCategory, WebsiteCategoryList } from '../types';
import WebsiteCategoryListJson from '../website.json';

export const getLocalStorage = async (key: string) => {
    return new Promise<any>((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result);
        });
    });
};

export const setLocalStorage = async (key: string, data: any) => {
    return new Promise<void>((resolve) => {
        chrome.storage.local.set({ [key]: data }, () => {
            console.log('[Storage]: setted', { [key]: data });
            resolve();
        });
    });
};

export const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // Months are zero-based
    const day = now.getUTCDate();

    return `${year}-${month}-${day}`;
};

export const getCategoryFromUrl = (url?: string): WebsiteCategory => {
    if (!url) {
        return 'Other' as WebsiteCategory;
    }
    const hostname = new URL(url).hostname.toLowerCase();

    for (const category in WebsiteCategoryListJson) {
        if (
            WebsiteCategoryListJson.hasOwnProperty(category) &&
            WebsiteCategoryListJson[category as keyof WebsiteCategoryList].some((website) =>
                hostname.includes(website.toLowerCase()),
            )
        ) {
            return category as WebsiteCategory;
        }
    }

    return 'Other' as WebsiteCategory;
};
