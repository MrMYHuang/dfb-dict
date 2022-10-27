import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, withIonLifeCycle, IonToast, IonButton, IonIcon, IonInput } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { shareSocial } from 'ionicons/icons';
import { withTranslation, WithTranslation } from 'react-i18next';

import { Bookmark } from '../models/Bookmark';
import Globals from '../Globals';
import { Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import OfflineDb from '../OfflineDb';

interface Props extends WithTranslation {
  bookmarks: Bookmark[];
  dispatch: Function;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface State {
  entry: string;
  customQuoteId: string;
  showToast: boolean;
  toastMessage: string;
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
      entry: '',
      customQuoteId: '1',
      showToast: false,
      toastMessage: '',
    }
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle className='uiFont'>{this.props.t('appName')}</IonTitle>

            <IonButton fill="clear" slot='end' onClick={e => {
              Globals.shareByLink(this.props.dispatch, decodeURIComponent(window.location.href));
            }}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>

          <div className='uiFont' style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0px 20px' }}>
            <div>
              <div style={{ padding: '20px 0px' }}>
                <IonInput className='uiFont' inputmode='numeric' value={this.state.customQuoteId}
                  onIonChange={(ev) => {
                    this.setState({ customQuoteId: `${ev.target.value}` })
                  }}>No.&nbsp;</IonInput>
              </div>
              <div style={{ textAlign: 'center' }}>
                <IonButton className='uiFont' fill='outline' shape='round' size='large' onClick={async () => {
                  const dictEntries = await OfflineDb.getDictEntries();
                  const totalEntries = dictEntries.length;
                  const entryId = +this.state.customQuoteId - 1;
                  if (isNaN(entryId) || 0 > entryId || entryId > totalEntries - 1) {
                    this.setState({ showToast: true, toastMessage: `請輸入介於1到${totalEntries}之間的數字` });
                    return;
                  }

                  const form = dictEntries[entryId].form;

                  this.props.history.push(`${Globals.pwaUrl}/entry/entry/${form}`);
                }}>{this.props.t('SelectByNumber')}</IonButton>
              </div>
            </div>

            <div className='uiFont'>---------- or ----------</div>

            <div style={{ padding: '20px 0px' }}>
              <IonButton className='uiFont' fill='outline' shape='round' size='large' onClick={async () => {
                this.props.history.push(`${Globals.pwaUrl}/search`);
              }}>{this.props.t('搜尋選辭')}</IonButton>
            </div>

            <div className='uiFont'>---------- or ----------</div>

            <div style={{ padding: '20px 0px' }}>
              <IonButton className='uiFont' fill='outline' shape='round' size='large' onClick={async () => {
                const dictEntries = await OfflineDb.getDictEntries();
                const entryId = Math.floor(Math.random() * dictEntries.length);

                const form = dictEntries[entryId].form;
                this.props.history.push(`${Globals.pwaUrl}/entry/entry/${form}`);
              }}>{this.props.t('SelectByRandom')}</IonButton>
            </div>
          </div>

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
