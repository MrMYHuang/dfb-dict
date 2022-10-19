import Globals from '../../Globals';
import { Bookmark } from '../../models/Bookmark';
import { defaultSettings, Settings } from '../../models/Settings';
import i18n from '../../i18n';

function updateUi(newSettings: Settings) {
  while (document.body.classList.length > 0) {
    document.body.classList.remove(document.body.classList.item(0)!);
  }
  document.body.classList.toggle(`theme${newSettings.theme}`, true);
  Globals.updateCssVars(newSettings);
  updateLanguage(newSettings.language);
}

function updateLanguage(lang: string) {
  i18n.changeLanguage(lang);
  Globals.electronBackendApi?.invoke('toMainV3', { event: 'changeLanguage', lang });
}

// Used to store settings. They will be saved to file.
export default function reducer(state = { ...defaultSettings }, action: any) {
  let newSettings: Settings = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case "LOAD_SETTINGS":
      newSettings = JSON.parse(localStorage.getItem(Globals.storeFile)!).settings;
      updateUi(newSettings);
      break;
    case "SET_KEY_VAL":
      var key = action.key;
      var val = action.val;
      (newSettings as any)[key] = val;
      switch (key) {
        case 'theme': {
          document.body.classList.forEach((val) => {
            if (/theme/.test(val)) {
              document.body.classList.remove(val);
            }
          });
          document.body.classList.toggle(`theme${val}`, true);
          break;
        }
        case 'fontSize':
        case 'uiFontSize': {
          Globals.updateCssVars(newSettings);
          break;
        }
        case 'language':
          updateLanguage(val);
          break;
      }
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    case "ADD_BOOKMARK":
      newSettings.bookmarks = [...newSettings.bookmarks, action.bookmark];
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    case "DEL_BOOKMARK": {
      let bookmarksTemp = newSettings.bookmarks as [Bookmark];
      const idxToDel = bookmarksTemp.findIndex((b) => { return b.uuid === action.uuid });
      if (idxToDel !== -1) {
        bookmarksTemp.splice(idxToDel, 1);
      }
      newSettings.bookmarks = [...bookmarksTemp];
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    }
    case "UPDATE_BOOKMARKS": {
      newSettings.bookmarks = action.bookmarks;
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    }
    // @ts-ignore
    case "DEFAULT_SETTINGS":
      newSettings = { ...defaultSettings };
      updateUi(newSettings);
      break;
    // eslint-disable-next-line
    default:
      if (Object.keys(newSettings).length === 0) {
        newSettings = { ...defaultSettings };
      }
      Object.keys(defaultSettings).forEach(key => {
        if ((newSettings as any)[key] === undefined) {
          (newSettings as any)[key] = (defaultSettings as any)[key];
        }
      });
      updateUi(newSettings);
  }
  return newSettings;
}
