import { WebsiteCategory, WebsiteCategoryList } from '../types';
import WebsiteCategoryListJson from '../website.json';

export function getCurrentDate(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // Months are zero-based
    const day = now.getUTCDate();

    return `${year}-${month}-${day}`;
}

export function getCategoryFromUrl(url?: string): WebsiteCategory {
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
}
