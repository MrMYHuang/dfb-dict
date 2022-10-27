import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, withIonLifeCycle, IonToast, IonButton, IonIcon } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { arrowBack, bookmark, shareSocial } from 'ionicons/icons';
import { withTranslation, WithTranslation } from 'react-i18next';

import { Bookmark } from '../models/Bookmark';
import Globals from '../Globals';
import { Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import OfflineDb, { DictEntry } from '../OfflineDb';

import './EntryPage.css';

interface Props extends WithTranslation {
  bookmarks: Bookmark[];
  dispatch: Function;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface State {
  entry: DictEntry;
  showToast: boolean;
  toastMessage: string;
  showUnlockToast: boolean;
  unlockToastMessage: string;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  id: string
  path: string;
}> { }

class _EntryPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      entry: {
        form: '',
        sense: {
          usg: '',
          def: '',
        }
      } as DictEntry,
      showToast: false,
      toastMessage: '',
      showUnlockToast: false,
      unlockToastMessage: '',
    };
  }

  async ionViewDidEnter() {
    const entry = await this.getQuote();
    this.setState({ entry });
  }

  ionViewWillLeave() {
  }

  componentDidMount() {
  }

  componentDidUpdate(preProps: PageProps) {
  }

  async getQuote() {
    await new Promise<void>((ok) => {
      const timer = setInterval(() => {
        if (!this.props.tmpSettings.loadingData && this.props.settings.appInitialized) {
          clearInterval(timer);
          ok();
        }
      }, 100);
    });

    const dictEntries = await OfflineDb.getDictEntries();
    return dictEntries.find(entry => entry.form === this.props.match.params.id)!;
  }

  addBookmarkHandler() {
    this.props.dispatch({
      type: "ADD_BOOKMARK",
      bookmark: ({
        uuid: this.props.match.params.id,
      }) as Bookmark,
    });
    this.setState({ showToast: true, toastMessage: this.props.t('NewBookmarkAdded') });
    return;
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonTitle className='uiFont'>{this.props.t('Definition')}</IonTitle>

            <IonButton fill="clear" slot='end' onClick={e => {
              this.addBookmarkHandler();
            }}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => {
              Globals.shareByLink(this.props.dispatch, decodeURIComponent(window.location.href));
            }}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className='uiFontX2' style={{ color: 'var(--ion-color-primary)' }}>{this.state.entry.form}</div>

          <div id='entry-container' className='textFont' onClick={() => {
            //this.props.history.push(`${Globals.pwaUrl}/entry/select`);
          }} dangerouslySetInnerHTML={{ __html: OfflineDb.senseToStr(this.state.entry.sense) }}>
          </div>

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={this.state.toastMessage}
            duration={2000}
          />

          <IonToast
            cssClass='uiFont toastSuccess'
            isOpen={this.state.showUnlockToast}
            onDidDismiss={() => this.setState({ showUnlockToast: false })}
            message={this.state.unlockToastMessage}
            buttons={[
              {
                text: this.props.t('Close'),
                role: 'cancel',
              }
            ]}
          />
        </IonContent>
      </IonPage>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: JSON.parse(JSON.stringify(state.settings.bookmarks)),
    settings: state.settings,
    tmpSettings: state.tmpSettings,
  }
};

//const mapDispatchToProps = {};

const EntryPage = withIonLifeCycle(_EntryPage);

export default withTranslation()(connect(
  mapStateToProps,
)(EntryPage));
