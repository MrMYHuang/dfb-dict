// Modules to control application life and create native browser window
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell } from 'electron';
import path from 'path';

import i18n from './i18n';
import Globals from './Globals';
const windowStateKeeper = require('electron-window-state');
const PackageInfos = require('../package.json');

// Workaround an issue of Linux wmclass not supporting the UTF-8 productName in package.json.
if (process.platform === 'linux') {
  app.setName(PackageInfos.name);
}

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
let mainWindow: BrowserWindow | null | undefined;

function isDevMode() {
  return !app.isPackaged || (process as any).defaultApp;
}

function getMenuTemplate() {
  const template = [
    new MenuItem({
      label: i18n.t('File'),
      submenu: [
        {
          role: 'quit',
          label: i18n.t('Quit'),
        },
      ]
    }),
    new MenuItem({
      label: i18n.t('Edit'),
      submenu: [
        {
          role: 'undo',
          label: i18n.t('Undo'),
        },
        {
          role: 'redo',
          label: i18n.t('Redo'),
        },
        {
          role: 'selectAll',
          label: i18n.t('Select All'),
        },
        {
          role: 'cut',
          label: i18n.t('Cut'),
        },
        {
          role: 'copy',
          label: i18n.t('Copy'),
        },
        {
          role: 'paste',
          label: i18n.t('Paste'),
        },
      ]
    }),
    new MenuItem({
      label: i18n.t('Run'),
      submenu: [
        {
          role: 'forceReload',
          label: i18n.t('Reload'),
        },
        {
          role: 'toggleDevTools',
          label: i18n.t('Dev Tools'),
          visible: false,
        },
      ].filter(v => v != null) as any
    }),
    new MenuItem({
      label: i18n.t('Window'),
      submenu: [
        {
          role: 'togglefullscreen',
          label: i18n.t('Full Screen'),
        },
        {
          label: i18n.t('Exit Full Screen'),
          accelerator: 'Esc',
          visible: false,
          click: (item: MenuItem, win: (BrowserWindow) | (undefined)) => {
            win?.setFullScreen(false);
          },
        },
        {
          label: i18n.t('Minimize'),
          role: 'minimize'
        },
        process.platform === 'darwin' ?
          {
            label: i18n.t('New'),
            click: () => {
              createWindow();
            }
          } : null,
        {
          label: i18n.t('Close'),
          role: 'close'
        }
      ].filter(v => v != null) as any
    }),
  ];
  return template;
}

i18n.on('languageChanged', (lang: string) => {
  mainWindow?.setTitle(i18n.t('productName'));
  const menu = Menu.buildFromTemplate(getMenuTemplate());
  Menu.setApplicationMenu(menu);
});

async function createWindow() {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      contextIsolation: true, // protect against prototype pollution
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  mainWindow.on('close', () => {
    ipcMain.removeAllListeners();
    ipcMain.removeHandler('toMainV3');
  });

  ipcMain.on('toMain', (ev, args) => {
    switch (args.event) {
      case 'ready':
        mainWindow?.webContents.send('fromMain', { event: 'version', version: PackageInfos.version });
        break;
    }
  });

  ipcMain.handle('toMainV3', async (ev, args) => {
    console.log(args);
    switch (args.event) {
      case 'changeLanguage':
        i18n.changeLanguage(args.lang);
        return { event: args.event, data: {} };
    }
  });

  const clearListeners = () => {
    mainWindow?.webContents.removeAllListeners('did-finish-load');
    mainWindow?.webContents.removeAllListeners('did-fail-load');
  }

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  let loadUrlSuccess = false;
  while (!loadUrlSuccess) {
    try {
      await new Promise<any>(async (ok, fail) => {
        mainWindow?.webContents.once('did-finish-load', (res: any) => {
          loadUrlSuccess = true;
          clearListeners();
          ok('');
        });
        mainWindow?.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
          clearListeners();
          fail(`Error ${errorCode}: ${errorDescription}`);
        });

        try {
          if (isDevMode()) {
            await mainWindow!.loadURL(Globals.devUrl);
          } else {
            await mainWindow!.loadURL(Globals.pwaUrl);
          }
        } catch (error) {
          fail(error);
        }
      });
    } catch (error) {
      clearListeners();
      console.error(error);
      const buttonId = dialog.showMessageBoxSync(mainWindow!, {
        message: `${i18n.t('networkErrorMsg')}\n${error}`,
        buttons: [i18n.t('Retry'), i18n.t('Cancel')],
      });

      if (buttonId === 1) {
        loadUrlSuccess = true;
      }
    }
  }

  // Open web link by external browser.
  mainWindow?.webContents.setWindowOpenHandler((detail) => {
    shell.openExternal(detail.url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
