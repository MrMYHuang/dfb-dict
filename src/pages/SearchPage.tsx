import React, { ReactNode } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonList, IonItem, IonLabel, IonToast, IonTitle, IonInfiniteScroll, IonInfiniteScrollContent, IonInput } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation, WithTranslation } from 'react-i18next';

import Globals from '../Globals';
import { search, shareSocial } from 'ionicons/icons';
import { Settings } from '../models/Settings';
import OfflineDb, { DictEntry } from '../OfflineDb';

interface Props extends WithTranslation {
  dispatch: Function;
  settings: Settings;
}

interface PageProps extends Props, RouteComponentProps<{
  path: string;
  tab: string;
  keyword: string;
}> { }

interface State {
  keyword: string;
  searches: DictEntry[];
  popover: any;
  isScrollOn: boolean;
  showToast: boolean;
  toastMessage: string;
}

class _SearchPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      searches: [],
      popover: {
        show: false,
        event: null,
      },
      isScrollOn: false,
      showToast: false,
      toastMessage: '',
    }
    this.filteredData = [];
  }

  ionViewWillEnter() {
    //console.log(`${this.props.match.url} will enter`);
    const keyword = this.props.match.params.keyword;
    this.setState({ keyword: keyword }, () => {
      this.search(true);
    });
  }

  /*
  componentDidMount() {
    //console.log(`did mount: ${this.props.match.url}`);
  }
  
  componentWillUnmount() {
    console.log(`${this.props.match.url} unmount`);
  }

  ionViewWillLeave() {
  }
  */

  page = 0;
  rows = 20;
  filteredData: DictEntry[];
  loadMoreLock = false;
  async search(newSearch: boolean = false) {
    if (this.props.match.params.keyword == null || this.props.match.params.keyword !== this.state.keyword) {
      return;
    }

    if (this.loadMoreLock) {
      return;
    }
    this.loadMoreLock = true;

    if (newSearch) {
      const dictEntries = await OfflineDb.getDictEntries();
      const re = new RegExp(`.*${this.props.match.params.keyword}.*`, 'i');
      this.filteredData = dictEntries.filter(entry => re.test(entry.form)).sort((e1, e2) => e1.form.length - e2.form.length);
      this.page = 0;
    }

    console.log(`Loading page ${this.page}`);

    const newAppendSearchesRangeEnd = Math.min((this.page + 1) * this.rows, this.filteredData.length);
    const newAppendSearches = this.filteredData.slice(this.page * this.rows, newAppendSearchesRangeEnd);
    const newSearches = newSearch ? newAppendSearches : [...this.state.searches, ...newAppendSearches];

    this.setState({
      searches: newSearches,
      isScrollOn: newSearches.length < this.filteredData.length,
    }, () => {
      this.page += 1;
      this.loadMoreLock = false;
    });

    if (newSearch) {
      let dictionaryHistory = JSON.parse(JSON.stringify(this.props.settings.dictionaryHistory));
      dictionaryHistory.unshift(this.state.keyword);
      dictionaryHistory.splice(10);
      this.props.dispatch({
        type: "SET_KEY_VAL",
        key: 'dictionaryHistory',
        val: dictionaryHistory,
      });
    }
    return true;
  }

  getRows() {
    const data = this.state.searches;
    let rows = new Array<ReactNode>();
    data.forEach((entry, i) => {
      rows.push(
        <IonItem button={true} key={`entry` + i}
          onClick={async event => {
            this.props.history.push({
              pathname: `${Globals.pwaUrl}/entry/entry/${entry.form}`,
            });
          }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='uiFont ion-text-wrap' key={`entryLabel_` + i}>
            {entry.form}
          </IonLabel>
        </IonItem>
      );
    });
    return rows;
  }

  clickToSearch() {
    if (this.state.keyword === this.props.match.params.keyword) {
      this.search(true);
    } else {
      this.props.history.push({
        pathname: `${Globals.pwaUrl}/search/${this.state.keyword}`,
      });
    }
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>{this.props.t('Search')}</IonTitle>

            <IonButton fill="clear" slot='end' onClick={e => {
              Globals.shareByLink(this.props.dispatch, decodeURIComponent(window.location.href));
            }}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <IonInput className='uiFont' placeholder={this.props.t('inputWord')} value={this.state.keyword}
              clearInput={(this.state.keyword?.length || 0) > 0}
              onKeyUp={(ev: any) => {
                const value = ev.target.value;
                this.setState({ keyword: value }, () => {
                  if (ev.key === 'Enter') {
                    this.clickToSearch();
                  }
                });
              }}
              onIonChange={(ev: any) => {
                const value = ev.target.value;
                this.setState({ keyword: value }, () => {
                  if (value === '') {
                    this.props.history.push({
                      pathname: `${Globals.pwaUrl}/search`,
                    });
                  }
                });
              }}
            />
            <IonButton fill='outline' size='large' onClick={() => {
              this.clickToSearch();
            }}>
              <IonIcon slot='icon-only' icon={search} />
            </IonButton>
          </div>

          {
            this.props.match.params.keyword == null ?
              <>
                <div className='uiFont' style={{ color: 'var(--ion-color-primary)' }}>{this.props.t('SearchHistory')}</div>
                <IonList>
                  {this.props.settings.dictionaryHistory.map((keyword, i) =>
                    <IonItem key={`dictHistoryItem_${i}`} button={true} onClick={async event => {
                      if (keyword === this.props.match.params.keyword) {
                        //                        this.setState({ keyword });
                        //                        this.search(true);
                      }
                      else {
                        this.props.history.push({
                          pathname: `${Globals.pwaUrl}/search/${keyword}`,
                        });
                      }
                    }}>
                      <IonLabel className='ion-text-wrap uiFont' key={`dictHistoryLabel_` + i}>
                        {keyword}
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
                <div style={{ textAlign: 'center' }}>
                  <IonButton fill='outline' shape='round' size='large' onClick={e => {
                    this.setState({ keyword: '' });
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'dictionaryHistory',
                      val: [],
                    });
                  }}>{this.props.t('ClearHistory')}</IonButton>
                </div>
              </>
              :
              this.state.searches.length < 1 ?
                <IonLabel className='uiFont'>
                  {this.props.t('wordNotFound')}
                </IonLabel>
                :
                <IonList>
                  {this.getRows()}
                  <IonInfiniteScroll threshold="100px"
                    disabled={!this.state.isScrollOn}
                    onIonInfinite={(ev: CustomEvent<void>) => {
                      this.search();
                      (ev.target as HTMLIonInfiniteScrollElement).complete();
                    }}>
                    <IonInfiniteScrollContent
                      loadingText={`${this.props.t('Loading')}...`}>
                    </IonInfiniteScrollContent>
                  </IonInfiniteScroll>
                </IonList>
          }

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={this.state.toastMessage}
            duration={2000}
          />
        </IonContent>
      </IonPage>
    );
  }
};

const SearchPage = withIonLifeCycle(_SearchPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    settings: state.settings,
  };
};

//const mapDispatchToProps = {};

export default withTranslation()(connect(
  mapStateToProps,
)(SearchPage));
