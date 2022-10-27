import React from 'react';
import { Redirect, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonAlert,
  IonToast,
  setupIonicReact,
  IonLoading,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { connect, Provider } from 'react-redux';
import queryString from 'query-string';
import { withTranslation, WithTranslation } from 'react-i18next';

import getSavedStore from './redux/store';
import { bookmark, settings, search, book } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import SettingsPage from './pages/SettingsPage';
import BookmarkPage from './pages/BookmarkPage';
import Globals from './Globals';
import ShareTextModal from './components/ShareTextModal';
import { Settings } from './models/Settings';
import EntryPage from './pages/EntryPage';
import EntrySelectPage from './pages/EntrySelectPage';
import IndexedDbFuncs from './IndexedDbFuncs';
import SearchPage from './pages/SearchPage';
import { TmpSettings } from './models/TmpSettings';
import OfflineDb from './OfflineDb';

const electronBackendApi: any = (window as any).electronBackendApi;

const store = getSavedStore();
/*
class DebugRouter extends IonReactRouter {
  constructor(props: any) {
    super(props);
    console.log('initial history is: ', JSON.stringify(this.history, null, 2))
    this.history.listen((location, action) => {
      console.log(
        `The current URL is ${location.pathname}${location.search}${location.hash}`
      )
      console.log(`The last navigation action was ${action}`, JSON.stringify(this.history, null, 2));
    });
  }
}
*/

setupIonicReact({
  mode: 'md', // Use a consistent UI style across Android and iOS.
  swipeBackEnabled: false,
});

export var serviceWorkCallbacks = {
  onLoad: function (registration: ServiceWorkerRegistration) { },
  onSuccess: function (registration: ServiceWorkerRegistration) { },
  onUpdate: function (registration: ServiceWorkerRegistration) { },
};

interface Props extends WithTranslation {
  dispatch: Function;
  shareTextModal: any;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
}>, WithTranslation { }

interface AppOrigProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

interface State {
  showToast: boolean;
  toastMessage: string;
  showUpdateAlert: boolean;
  showRestoreAppSettingsToast: boolean;
}

class _App extends React.Component<PageProps> {
  render() {
    return (
      <Provider store={store}>
        <AppOrig {...this.props} />
      </Provider>
    );
  }
}

class _AppOrig extends React.Component<AppOrigProps, State> {
  originalAppSettingsStr: string | null | undefined;

  constructor(props: any) {
    super(props);
    if (!this.props.settings.hasAppLog) {
      Globals.disableAppLog();
    }

    electronBackendApi?.receive("fromMain", (data: any) => {
      switch (data.event) {
        case 'version':
          this.props.dispatch({
            type: "TMP_SET_KEY_VAL",
            key: 'mainVersion',
            val: data.version,
          });
          break;
      }
    });
    electronBackendApi?.send("toMain", { event: 'ready' });

    // ----- Initializing UI settings -----
    // Apply the theme setting.
    while (document.body.classList.length > 0) {
      document.body.classList.remove(document.body.classList.item(0)!);
    }
    document.body.classList.toggle(`theme${this.props.settings.theme}`, true);

    // Modify UI settings from query string.
    const queryParams = queryString.parse(this.props.location.search) as any;
    if (queryParams.settings) {
      this.originalAppSettingsStr = localStorage.getItem(Globals.storeFile);
      (queryParams.settings as string).split(',').forEach(setting => {
        const keyVal = setting.split('=');
        this.props.dispatch({
          type: "SET_KEY_VAL",
          key: keyVal[0],
          val: +keyVal[1],
        });
      });
    }
    Globals.updateCssVars(this.props.settings);

    let showToastInit = false;
    let toastMessageInit = '';

    if (this.props.settings.appInitialized) {
      this.openDict();
    } else {
      this.props.dispatch({
        type: "TMP_SET_KEY_VAL",
        key: 'loadingData',
        val: false,
      });
    }

    this.state = {
      showUpdateAlert: false,
      showRestoreAppSettingsToast: (queryParams.settings != null && this.originalAppSettingsStr != null) || false,
      showToast: showToastInit,
      toastMessage: toastMessageInit,
    };

    serviceWorkCallbacks.onUpdate = (registration: ServiceWorkerRegistration) => {
      this.setState({ showUpdateAlert: true });
    };

    serviceWorkCallbacks.onSuccess = (registration: ServiceWorkerRegistration) => {
    };

    // Enable screen wake lock.
    if ((navigator as any).wakeLock) {
      this.wakeLockScreen();
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === 'visible') {
          this.wakeLockScreen();
        } else {
          this.wakeLockScreenRelease()
        }
      });
    }
  }

  async openDict() {
    this.props.dispatch({
      type: "TMP_SET_KEY_VAL",
      key: 'loadingData',
      val: true,
    });
    return IndexedDbFuncs.open().then(() => {
      let updateAssets = Promise.resolve(false);
      if (this.props.settings.assetsVersion < Globals.assetsVersion) {
        updateAssets = Globals.updateAssets(this.props.dispatch).then(() => true);
      }
      updateAssets.then((forceUpdate) => {
        return OfflineDb.init(forceUpdate);
      }).catch((error) => {
        this.setState({ showToast: true, toastMessage: `Error! ${error}` });
      }).finally(() => {
        this.props.dispatch({
          type: "TMP_SET_KEY_VAL",
          key: 'loadingData',
          val: false,
        });
      });
    });
  }

  restoreAppSettings() {
    localStorage.setItem(Globals.storeFile, this.originalAppSettingsStr!);
    this.props.dispatch({ type: 'LOAD_SETTINGS' });
  }

  // Prevent device from sleeping.
  wakeLock: any;
  async wakeLockScreen() {
    try {
      const wakeLock = (navigator as any).wakeLock;
      if (wakeLock != null) {
        this.wakeLock = await wakeLock.request('screen');
        console.log('Screen wake lock is requested.');
      } else {
        console.error('navigator.wakeLock is undefined.');
      }
    } catch (err: any) {
      // the wake lock request fails - usually system related, such low as battery
      console.log(`${err.name}, ${err.message}`);
      console.log(new Error().stack);
    }
  }

  async wakeLockScreenRelease() {
    if (this.wakeLock != null) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Screen wake lock is released.');
    }
  }

  routeByQueryString() {
    // This app uses client side routing. 
    // Without the first loading of this app,
    // any client side route becomes a server side route!
    // These invalid server side routings cause 404 errors.
    // To workaround these errors, we can use GitHub 404.html redirection
    // to pass the client side routes to this app by using query string.
    // After this app loads, it can use the query string to correctly redirect to
    // a client side route!
    console.log(window.location.search);
    const routeMatches = /route=([^&]*)/.exec(window.location.search);
    const queryMatches = /query=([^&]*)/.exec(window.location.search);
    if (routeMatches !== null) {
      const route = decodeURIComponent(routeMatches[1]);

      let query = ''
      if (queryMatches !== null) {
        query = decodeURIComponent(queryMatches[1]);
      }
      return <Redirect to={`${Globals.pwaUrl}` + route + query} />;
    } else if (window.location.pathname === `${Globals.pwaUrl}/` || window.location.pathname === `${Globals.pwaUrl}`) {
      return <Redirect to={`${Globals.pwaUrl}/entry/select`} />;
    }
  }

  render() {
    return (
      <IonApp>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet animated={false}>
              {/* The following route is for backward compatibility. */}
              <Route path={`${Globals.pwaUrl}/:tab(entry)/select`} render={(props: any) => <EntrySelectPage {...props} />} exact={true} />
              <Route path={`${Globals.pwaUrl}/:tab(entry)/entry/:id`} render={(props: any) => <EntryPage {...props} />} exact={true} />
              <Route path={`${Globals.pwaUrl}/:tab(search)/:keyword?`} render={(props: any) => <SearchPage {...props} />} exact={true} />
              <Route path={`${Globals.pwaUrl}/:tab(bookmarks)`} render={(props: any) => <BookmarkPage {...props} />} exact={true} />
              <Route path={`${Globals.pwaUrl}/settings`} render={(props: any) => <SettingsPage {...props} />} />
              <Route path={`${Globals.pwaUrl}/`} render={() => { return this.routeByQueryString(); }} exact={true} />
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="entry" href={`${Globals.pwaUrl}/entry/select`}>
                <IonIcon icon={book} />
              </IonTabButton>
              <IonTabButton tab="search" href={`${Globals.pwaUrl}/search`}>
                <IonIcon icon={search} />
              </IonTabButton>
              <IonTabButton tab="bookmarks" href={`${Globals.pwaUrl}/bookmarks`}>
                <IonIcon icon={bookmark} />
              </IonTabButton>
              <IonTabButton tab="settings" href={`${Globals.pwaUrl}/settings`}>
                <IonIcon icon={settings} />
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>

        <IonAlert
          cssClass='uiFont'
          isOpen={this.state.showUpdateAlert}
          backdropDismiss={false}
          onDidPresent={async (ev) => {
            // Run SKIP_WAITING at onDidPresent event to avoid a race condition of
            // an old page fetching old JS chunks with a new service worker!
            try {
              (await Globals.getServiceWorkerReg()).installing?.postMessage({ type: 'SKIP_WAITING' });
              (await Globals.getServiceWorkerReg()).waiting?.postMessage({ type: 'SKIP_WAITING' });
            } catch (error) {
              console.error(error);
            }

            Globals.getServiceWorkerRegUpdated().installing?.postMessage({ type: 'SKIP_WAITING' });
            Globals.getServiceWorkerRegUpdated().waiting?.postMessage({ type: 'SKIP_WAITING' });
          }}
          header={this.props.t('updateMsg')}
          buttons={[
            {
              text: this.props.t('Close'),
              cssClass: 'primary uiFont',
              handler: (value) => {
                this.setState({
                  showUpdateAlert: false,
                });
              },
            },
          ]}
        />

        <IonAlert
          cssClass='uiFont'
          backdropDismiss={false}
          isOpen={!this.props.settings.appInitialized}
          header='初次啟動'
          message='須下載離線資料，請按確定以繼續'
          buttons={[
            {
              text: this.props.t('Ok'),
              cssClass: 'primary uiFont',
              handler: async (value) => {
                await this.openDict();
                this.props.dispatch({
                  type: "SET_KEY_VAL",
                  key: 'appInitialized',
                  val: true,
                });
              },
            },
          ]}
        />

        <ShareTextModal
          {...{
            text: this.props.shareTextModal?.text,
            showModal: this.props.shareTextModal?.show || false,
            finish: () => {
              this.props.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'shareTextModal',
                val: { show: false },
              });
            }, ...this.props
          }}
        />

        <IonToast
          cssClass='uiFont'
          isOpen={this.state.showRestoreAppSettingsToast}
          onDidDismiss={() => this.setState({ showRestoreAppSettingsToast: false })}
          message={this.props.t('appSettingsApplied')}
          buttons={[
            {
              text: this.props.t('Cancel'),
              role: 'cancel',
              handler: () => this.setState({ showRestoreAppSettingsToast: false })
            },
            {
              text: this.props.t('Restore'),
              handler: () => this.restoreAppSettings(),
            },
          ]}
        />

        <IonLoading
          cssClass='uiFont'
          isOpen={this.props.tmpSettings.loadingData}
          message={'載入中...'}
        />

        <IonToast
          cssClass='uiFont'
          isOpen={this.state.showToast}
          onDidDismiss={() => this.setState({ showToast: false })}
          message={this.state.toastMessage}
          duration={2000}
        />
      </IonApp>
    );
  }
}

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    shareTextModal: state.tmpSettings.shareTextModal,
    settings: state.settings,
    tmpSettings: state.tmpSettings,
  }
};

const AppOrig = connect(
  mapStateToProps,
)(_AppOrig);

const App = withTranslation()(withRouter(_App));

export default App;
