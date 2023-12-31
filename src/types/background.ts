export type WebsiteCategory =
    | 'Social Media'
    | 'Productivity'
    | 'News'
    | 'E-commerce'
    | 'Blogs'
    | 'Knowledge/Technology/Academic'
    | 'Entertainment'
    | 'Finance'
    | 'Search'
    | 'Other';

export interface History {
    url: string;
    category: WebsiteCategory;
    visitCount: number;
    visitDuration: number;
    lastVisit?: number;
}

export interface Bookmark {
    title: string;
    url?: string;
    addedAt?: number;
    folder?: string;
    category: WebsiteCategory;
}

export interface AttentionRecord {
    history: History[];
    bookmarks: Bookmark[];
}

export enum SystemCall {
    GetAttentionRecord = 'GetAttentionRecord',
}

export type WebsiteCategoryList = Omit<Record<WebsiteCategory, string[]>, 'Other'>;
