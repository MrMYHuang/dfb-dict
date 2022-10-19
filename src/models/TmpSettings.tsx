interface IShareTextModal {
    text: string;
    show: boolean;
}

export interface TmpSettings {
    loadingData: boolean;
    shareTextModal: IShareTextModal;
    showLangSelector: boolean;
    mainVersion: string | null;
}

const defaultTmpSettings = {
    loadingData: true,
    shareTextModal: {
        text: '',
        show: false,
    },
    showLangSelector: false,
    mainVersion: null,
} as TmpSettings;

export default defaultTmpSettings;
