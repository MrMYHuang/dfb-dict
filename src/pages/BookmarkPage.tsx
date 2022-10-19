import React, { ReactNode } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonReorderGroup, IonReorder, IonItem, IonLabel, withIonLifeCycle, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonButton, IonToast } from '@ionic/react';
import { ItemReorderEventDetail } from '@ionic/core';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { swapVertical } from 'ionicons/icons';
import { withTranslation, WithTranslation } from 'react-i18next';

import { Bookmark } from '../models/Bookmark';
import Globals from '../Globals';

interface Props extends WithTranslation {
  dispatch: Function;
  bookmarks: Bookmark[];
  fontSize: number;
}

interface State {
  reorder: boolean;
  showToast: boolean;
  toastMessage: string;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

class _BookmarkPage extends React.Component<PageProps, State> {
  bookmarkListRef: React.RefObject<HTMLIonListElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      reorder: false,
      showToast: false,
      toastMessage: '',
    }
    this.bookmarkListRef = React.createRef<HTMLIonListElement>();
  }

  helpDoc = Globals.isStoreApps() ?
    <></>
    :
    <>
      <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/dfb-dict#web-app" target="_new">{this.props.t('appInstall')}</a></div>
    </>
    ;
  noBookmarkMessage = this.props.t('noBookmarkMessage');
  ionViewWillEnter() {
    let queryParams = queryString.parse(this.props.location.search) as any;
    if (queryParams.item && queryParams.item < this.props.bookmarks.length) {
      const bookmark = this.props.bookmarks[queryParams.item];
      this.props.history.push(`${Globals.pwaUrl}/entry/entry/${bookmark.uuid}`);
    } else if (!this.hasBookmark) {
      this.setState({ showToast: true, toastMessage: this.noBookmarkMessage });
      this.props.history.push(`${Globals.pwaUrl}/entry/select`);
    }
    //console.log( 'view will enter' );
  }

  get hasBookmark() {
    return this.props.bookmarks.length > 0;
  }

  delBookmarkHandler(uuidStr: String) {
    this.props.dispatch({
      type: "DEL_BOOKMARK",
      uuid: uuidStr,
    });

    setTimeout(() => {
      if (!this.hasBookmark) {
        this.setState({ showToast: true, toastMessage: this.noBookmarkMessage });
        this.props.history.push(`${Globals.pwaUrl}/entry`);
      }
    }, 0);
  }

  reorderBookmarks(event: CustomEvent<ItemReorderEventDetail>) {
    const bookmarks = event.detail.complete(this.props.bookmarks);
    this.props.dispatch({
      type: "UPDATE_BOOKMARKS",
      bookmarks: bookmarks,
    });
  }

  getBookmarkRows() {
    let bookmarks = this.props.bookmarks;
    let rows = Array<ReactNode>();
    bookmarks.forEach((bookmark, i) => {
      let routeLink = ``;
      let label = `${bookmark.uuid}`;
      routeLink = `${Globals.pwaUrl}/entry/entry/${bookmark.uuid}`;
      rows.push(
        <IonItemSliding key={`bookmarkItemSliding_` + i}>
          <IonItem key={`bookmarkItem_` + i} button={true} onClick={async event => {
            if (this.state.reorder) {
              this.setState({ showToast: true, toastMessage: this.props.t('alertDisableReorder') });
              return;
            }

            event.preventDefault();
            this.props.history.push({
              pathname: routeLink,
            });
          }}>
            <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
            <IonLabel className='uiFont' key={`bookmarkItemLabel_` + i}>
              {label}
            </IonLabel>
            <IonReorder slot='end' />
          </IonItem>

          <IonItemOptions side="end">
            <IonItemOption className='uiFont' color='danger' onClick={(e) => {
              this.delBookmarkHandler(bookmark.uuid);
              this.bookmarkListRef.current?.closeSlidingItems();
            }}>{this.props.t('Delete')}</IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      );
    });
    return rows;
  }

  render() {
    const rows = this.getBookmarkRows();

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle className='uiFont'>{this.props.t('Bookmarks')}</IonTitle>

            <IonButton fill={this.state.reorder ? 'solid' : 'clear'} slot='end'
              onClick={ev => this.setState({ reorder: !this.state.reorder })}>
              <IonIcon icon={swapVertical} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.hasBookmark ?
            <>
              <IonList key='bookmarkList0' ref={this.bookmarkListRef}>
                <IonReorderGroup disabled={!this.state.reorder} onIonItemReorder={(event: CustomEvent<ItemReorderEventDetail>) => { this.reorderBookmarks(event); }}>
                  {rows}
                </IonReorderGroup>
              </IonList>
              {this.helpDoc}
            </> :
            <>
              <IonList key='bookmarkList1'>
                {rows}
              </IonList>
              {this.helpDoc}
            </>
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

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: JSON.parse(JSON.stringify(state.settings.bookmarks)),
  }
};

//const mapDispatchToProps = {};

const BookmarkPage = withIonLifeCycle(_BookmarkPage);

export default withTranslation()(connect(
  mapStateToProps,
)(BookmarkPage));
