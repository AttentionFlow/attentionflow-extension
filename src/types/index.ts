export interface History {
    url: string;
    visitCount: number;
    visitDuration: number;
    lastVisit?: number;
}

export interface Bookmark {
    title: string;
    url?: string;
    addedAt?: number;
}

export interface AttentionRecord {
    history: History[];
    bookmarks: Bookmark[];
}

export enum SystemCall {
    GetAttentionRecord = 'GetAttentionRecord',
}
