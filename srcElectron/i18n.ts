import i18n from 'i18next';

import * as zh from './locales/zh/translation.json';

i18n
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        fallbackLng: 'zh',
        debug: false,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });

i18n.addResources('zh', 'translation', zh);

export default i18n;
