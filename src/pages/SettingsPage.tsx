/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonIcon, IonLabel, IonToggle, IonButton, IonAlert, IonSelect, IonSelectOption, IonToast, withIonLifeCycle, IonProgressBar, IonLoading } from '@ionic/react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import Globals from '../Globals';
import { helpCircle, text, refreshCircle, colorPalette, bug, informationCircle, settings, language } from 'ionicons/icons';
import axios from 'axios';
import { withTranslation, WithTranslation } from 'react-i18next';

import './SettingsPage.css';
import PackageInfos from '../../package.json';
import { Bookmark, } from '../models/Bookmark';
import { Settings } from '../models/Settings';
import OfflineDb from '../OfflineDb';

interface StateProps {
  showBugReportAlert: boolean;
  showFontLicense: boolean;
  isDownloading: boolean;
  fontDownloadedRatio: number;
  showDownloadKaiFontAlert: boolean;
  showClearAlert: boolean;
  showToast: boolean;
  toastMessage: string;
}

interface Props extends WithTranslation {
  dispatch: Function;
  hasAppLog: boolean;
  theme: number;
  uiFontSize: number;
  settings: Settings;
  voiceURI: string;
  speechRate: number;
  bookmarks: [Bookmark];
  mainVersion: string | null;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class _SettingsPage extends React.Component<PageProps, StateProps> {
  constructor(props: any) {
    super(props);

    this.state = {
      showBugReportAlert: false,
      showFontLicense: false,
      fontDownloadedRatio: 0,
      showDownloadKaiFontAlert: false,
      isDownloading: false,
      showClearAlert: false,
      showToast: false,
      toastMessage: '',
    };
  }

  ionViewWillEnter() {
  }

  async updateOfflineData() {
    try {
      this.setState({ isDownloading: true });
      await Globals.updateAssets(this.props.dispatch);
      await OfflineDb.init(true);
      this.setState({ showToast: true, toastMessage: `離線資料更新完畢！` });
    } catch (error) {
      this.setState({ showToast: true, toastMessage: `${this.props.t('Error')}: ${error}` });
    }

    this.setState({ isDownloading: false });
  }

  reportText = '';
  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle className='uiFont'>{this.props.t('Settings')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {/*
              // Disable app update for Mac App Store submission.
            <IonItem>
              <IonIcon icon={shareSocial} slot='start' />
              <IonLabel className='ion-text-wrap uiFont' onClick={async e => {
                const hasUpdate = await Globals.updateApp();

                if (!hasUpdate) {
                  this.setState({ showToast: true, toastMessage: 'App 已是最新版' });
                }
              }}>PWA版本: <a href="https://github.com/MrMYHuang/dfb-dict#history" target="_new">{PackageInfos.pwaVersion}</a></IonLabel>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={e => {
                Globals.shareByLink(this.props.dispatch, decodeURIComponent(window.location.origin));
              }}>分享</IonButton>
            </IonItem>
            
            <IonItem hidden={!this.props.mainVersion}>
              <IonIcon icon={informationCircle} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>Backend app 版本: {this.props.mainVersion}</IonLabel>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={e => {
              }}>分享</IonButton>
            </IonItem>*/}
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={refreshCircle} slot='start' />
              <div style={{ width: '100%' }}>
                <IonLabel className='ion-text-wrap uiFont'>更新離線資料</IonLabel>
                <IonLabel className='ion-text-wrap uiFont'>上次更新：{new Date(this.props.settings.assetsUpdateDate).toLocaleDateString()}</IonLabel>
              </div>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={async (e) => this.updateOfflineData()}>更新</IonButton>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={bug} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'><a href="https://github.com/MrMYHuang/dfb-dict#report" target="_new">{this.props.t('enableErrorLog')}</a></IonLabel>
              <IonToggle slot='end' checked={this.props.hasAppLog} onIonChange={e => {
                const isChecked = e.detail.checked;

                if (this.props.hasAppLog === isChecked) {
                  return;
                }

                isChecked ? Globals.enableAppLog() : Globals.disableAppLog();
                this.props.dispatch({
                  type: "SET_KEY_VAL",
                  key: 'hasAppLog',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem hidden={!this.props.settings.hasAppLog}>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={bug} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{this.props.t('reportError')}</IonLabel>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={e => {
                this.reportText = "瀏覽器：" + navigator.userAgent + "\n\nApp 版本：" + PackageInfos.pwaVersion + "\n\nApp設定：" + JSON.stringify(this.props.settings) + "\n\nLog：\n" + Globals.getLog();
                this.setState({ showBugReportAlert: true });
              }}>{this.props.t('Report')}</IonButton>
              <IonAlert
                cssClass='uiFont'
                backdropDismiss={false}
                isOpen={this.state.showBugReportAlert}
                header={this.props.t('errorReport')}
                subHeader={this.props.t('errorReportTitle')}
                inputs={[
                  {
                    name: 'name0',
                    type: 'email',
                    placeholder: `${this.props.t('E.g.')}: a@b.c`
                  },
                  {
                    name: 'name1',
                    type: 'textarea',
                    placeholder: this.props.t('errorSteps')
                  },
                ]}
                buttons={[
                  {
                    text: this.props.t('Submit'),
                    cssClass: 'primary uiFont',
                    handler: async (value) => {
                      if (!/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value.name0)) {
                        this.setState({ showBugReportAlert: false, showToast: true, toastMessage: this.props.t('emailError') });
                        return
                      }

                      try {
                        const axiosInstance = axios.create({ timeout: 10000 });
                        await axiosInstance.post(Globals.bugReportApiUrl, {
                          subject: `${PackageInfos.productName} 異常記錄回報`,
                          text: `E-mail: ${value.name0}\n\n發生步驟: ${value.name1}\n\n${this.reportText}`,
                        });
                        this.setState({ showBugReportAlert: false, showToast: true, toastMessage: this.props.t('reportErrorSuccess') });
                      } catch (error) {
                        console.error(error);
                        this.setState({ showBugReportAlert: false, showToast: true, toastMessage: this.props.t('reportErrorFail') });
                      }
                    },
                  },
                  {
                    text: this.props.t('Cancel'),
                    role: 'cancel',
                    cssClass: 'secondary uiFont',
                    handler: () => this.setState({ showBugReportAlert: false }),
                  },
                ]}
              />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={settings} slot='start' />
              <div className='contentBlock'>
                <div style={{ flexDirection: 'column' }}>
                  <IonLabel className='ion-text-wrap uiFont'>{this.props.t('appSettings')}</IonLabel>
                  <div style={{ textAlign: 'right' }}>
                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={async (e) => {
                      const settingsJsonUri = `data:text/json;charset=utf-8,${encodeURIComponent(localStorage.getItem(Globals.storeFile) || '')}`;
                      const a = document.createElement('a');
                      a.href = settingsJsonUri;
                      a.download = Globals.storeFile;
                      a.click();
                      a.remove();
                    }}>{this.props.t('Export')}</IonButton>
                    <input aria-label='Export' id='importJsonInput' type='file' accept='.json' style={{ display: 'none' }} onChange={async (ev) => {
                      const file = ev.target.files?.item(0);
                      const fileText = await file?.text() || '';
                      try {
                        // JSON text validation.
                        JSON.parse(fileText);
                        localStorage.setItem(Globals.storeFile, fileText);
                        this.props.dispatch({ type: 'LOAD_SETTINGS' });
                      } catch (e) {
                        console.error(e);
                        console.error(new Error().stack);
                      }
                      (document.getElementById('importJsonInput') as HTMLInputElement).value = '';
                    }} />

                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={(e) => {
                      (document.querySelector('#importJsonInput') as HTMLInputElement).click();
                    }}>{this.props.t('Import')}</IonButton>
                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={(e) => {
                      this.setState({ showClearAlert: true });
                    }}>{this.props.t('Reset')}</IonButton>
                    <IonAlert
                      cssClass='uiFont'
                      isOpen={this.state.showClearAlert}
                      backdropDismiss={false}
                      onDidPresent={(ev) => {
                      }}
                      header={this.props.t('resetMessage')}
                      buttons={[
                        {
                          text: this.props.t('Cancel'),
                          cssClass: 'primary uiFont',
                          handler: (value) => {
                            this.setState({
                              showClearAlert: false,
                            });
                          },
                        },
                        {
                          text: this.props.t('Reset'),
                          cssClass: 'secondary uiFont',
                          handler: async (value) => {
                            await Globals.clearAppData();
                            this.props.dispatch({ type: 'DEFAULT_SETTINGS' });
                            this.setState({ showClearAlert: false, showToast: true, toastMessage: this.props.t('resetSuccess') });
                          },
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={colorPalette} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{this.props.t('theme')}</IonLabel>
              <IonSelect slot='end'
                value={+this.props.theme}
                className='uiFont'
                interface='popover'
                interfaceOptions={{ cssClass: 'dfb-dictthemes' }}
                onIonChange={e => {
                  const value = +e.detail.value;
                  // Important! Because it can results in rerendering of this component but
                  // store states (this.props.theme) of this component is not updated yet! And IonSelect value will be changed
                  // back to the old value and onIonChange will be triggered again!
                  // Thus, we use this check to ignore this invalid change.
                  if (+this.props.theme === value) {
                    return;
                  }

                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'theme',
                    val: value,
                  });
                }}>
                <IonSelectOption className='uiFont green' value={0}>{this.props.t('themeGreen')}</IonSelectOption>
                <IonSelectOption className='uiFont dark' value={1}>{this.props.t('themeDark')}</IonSelectOption>
                <IonSelectOption className='uiFont light' value={2}>{this.props.t('themeLight')}</IonSelectOption>
                <IonSelectOption className='uiFont oldPaper' value={3}>{this.props.t('themeOldPaper')}</IonSelectOption>
                <IonSelectOption className='uiFont marble' value={4}>{this.props.t('themeMarble')}</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={text} slot='start' />
              <div className="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <span className='ion-text-wrap uiFont'>{this.props.t('uiFontSize')}: {this.props.uiFontSize}</span>
                  <IonRange min={10} max={48} pin={true} snaps={true} value={this.props.uiFontSize} onIonChange={e => {
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'uiFontSize',
                      val: +e.detail.value,
                    });
                  }} />
                </div>
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={text} slot='start' />
              <div className="contentBlock">
                <IonLabel className='ion-text-wrap uiFont'>{this.props.t('fontSize')}: <span className='textFont'>{this.props.settings.fontSize}</span></IonLabel>
                <IonRange min={10} max={128} pin={true} snaps={true} value={this.props.settings.fontSize} onIonChange={e => {
                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'fontSize',
                    val: +e.detail.value,
                  });
                }} />
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={helpCircle} slot='start' />
              <div className='uiFont'>
                <div>{this.props.t('About')}</div>
                <div>{this.props.t('Author')}: Meng-Yuan Huang</div>
                <div><a href="mailto:myh@live.com" target="_new">myh@live.com</a></div>
                <div><a href="https://github.com/MrMYHuang/dfb-dict" target="_new">{this.props.t('manualAndOpenSource')}</a></div>
                <div><a href="https://github.com/MrMYHuang/dfb-dict#copyrights" target="_new">{this.props.t('copyrights')}</a></div>
              </div>
            </IonItem>
          </IonList>

          <IonLoading
            cssClass='uiFont'
            isOpen={this.state.isDownloading}
            message={`${this.props.t('dowloading')}...`}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={this.state.toastMessage}
            duration={2000}
          />
        </IonContent>
      </IonPage >
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    settings: JSON.parse(JSON.stringify(state.settings)),
    hasAppLog: state.settings.hasAppLog,
    theme: state.settings.theme,
    uiFontSize: state.settings.uiFontSize,
    speechRate: state.settings.speechRate,
    bookmarks: state.settings.bookmarks,
    voiceURI: state.settings.voiceURI,
    mainVersion: state.tmpSettings.mainVersion,
  }
};

const SettingsPage = withIonLifeCycle(_SettingsPage);

export default withTranslation()(connect(
  mapStateToProps,
)(SettingsPage));
