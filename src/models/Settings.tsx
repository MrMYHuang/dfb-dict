import { Bookmark } from "./Bookmark";

export interface Settings {
    version: number;
    assetsVersion: number;
    assetsUpdateDate: string;
    appInitialized: boolean;
    language: string;
    hasAppLog: boolean;
    theme: number;
    fontSize: number;
    uiFontSize: number;
    voiceURI: string | null;
    speechRate: number;
    bookmarks: Bookmark[];
    dictionaryHistory: string[];
}

export const defaultSettings = {
    version: 1,
    assetsVersion: 0,
    assetsUpdateDate: new Date().toISOString(),
    appInitialized: false,
    language: 'en',
    hasAppLog: true,
    theme: 2,
    fontSize: 32,
    uiFontSize: 24,
    voiceURI: null,
    speechRate: 0.8,
    bookmarks: [],
    dictionaryHistory: [],
} as Settings;
