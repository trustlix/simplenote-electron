import React, { PropTypes } from 'react';
import TabbedDialog from '../tabbed-dialog';
import { viewExternalUrl } from '../utils/url-utils';
import TopRightArrowIcon from '../icons/arrow-top-right';

import RadioGroup from './radio-settings-group';
import ToggleGroup from './toggle-settings-group';
import SettingsGroup, { Item } from './settings-group';

const settingTabs = ['account', 'display'];

export const SettingsDialog = React.createClass({
  propTypes: {
    actions: PropTypes.object.isRequired,
    onSignOut: PropTypes.func.isRequired,
    isElectron: PropTypes.bool.isRequired,
  },

  onDone() {
    this.props.actions.closeDialog({ key: this.props.dialog.key });
  },

  onEditAccount() {
    viewExternalUrl('https://app.simplenote.com/settings');
  },

  onUpdateSortType(event) {
    this.onUpdateSettingValue(event);
    this.props.actions.loadNotes({
      noteBucket: this.props.noteBucket,
    });
  },

  onUpdateSortReversed(event) {
    this.onUpdateSettingBool(event);
    this.props.actions.loadNotes({
      noteBucket: this.props.noteBucket,
    });
  },

  onSignOutRequested() {
    // Safety first! Check for any unsynced notes before signing out.
    const { onSignOut, noteBucket } = this.props;
    const { notes } = this.props.appState;
    const { getVersion } = noteBucket;

    noteBucket.hasLocalChanges((error, hasChanges) => {
      if (hasChanges) {
        this.showUnsyncedWarning();
        return;
      }

      // Also check persisted store for any notes with version 0
      const noteHasSynced = note =>
        new Promise((resolve, reject) =>
          getVersion(note.id, (e, v) => (e || v === 0 ? reject() : resolve()))
        );

      Promise.all(notes.map(noteHasSynced)).then(
        () => onSignOut(), // All good, sign out now!
        () => this.showUnsyncedWarning() // Show a warning to the user
      );
    });
  },

  showUnsyncedWarning() {
    const { isElectron } = this.props;
    isElectron ? this.showElectronWarningDialog() : this.showWebWarningDialog();
  },

  showElectronWarningDialog() {
    const { onSignOut } = this.props;
    const dialog = __non_webpack_require__('electron').remote.dialog; // eslint-disable-line no-undef
    dialog.showMessageBox(
      {
        type: 'warning',
        buttons: ['Delete Notes', 'Cancel', 'Visit Web App'],
        title: 'Unsynced Notes Detected',
        message:
          'Logging out will delete any unsynced notes. You can verify your ' +
          'synced notes by logging in to the Web App.',
      },
      response => {
        if (response === 0) {
          onSignOut();
        } else if (response === 2) {
          viewExternalUrl('https://app.simplenote.com');
        }
      }
    );
  },

  showWebWarningDialog() {
    const { onSignOut } = this.props;
    const shouldReallySignOut = confirm(
      'Warning: Unsynced notes were detected.\n\n' +
        'Logging out will delete any notes that have not synced. ' +
        'Check your connection and visit app.simplenote.com to verify synced notes.' +
        '\n\nClick OK to delete unsynced notes and Log Out.'
    );

    if (shouldReallySignOut) {
      onSignOut();
    }
  },

  render() {
    var dialog = this.props.dialog;

    return (
      <TabbedDialog
        className="settings"
        title="Settings"
        tabs={settingTabs}
        onDone={this.onDone}
        renderTabName={this.renderTabName}
        renderTabContent={this.renderTabContent}
        {...dialog}
      />
    );
  },

  renderTabName(tabName) {
    return tabName;
  },

  renderTabContent(tabName) {
    const {
      activateTheme,
      setNoteDisplay,
      setSortType,
      toggleSortOrder,
    } = this.props;

    const {
      settings: {
        theme: activeTheme,
        noteDisplay,
        sortType,
        sortReversed: sortIsReversed,
        accountName,
      },
    } = this.props;

    switch (tabName) {
      case 'account':
        return (
          <div className="dialog-column settings-account">
            <h3 className="panel-title theme-color-fg-dim">Account</h3>
            <div className="settings-items theme-color-border">
              <div className="settings-item theme-color-border">
                <span className="settings-account-name">{accountName}</span>
              </div>
            </div>

            <ul className="dialog-actions">
              <li>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={this.onSignOutRequested}
                >
                  Log Out
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="button button button-borderless"
                  onClick={this.onEditAccount}
                >
                  Edit Account <TopRightArrowIcon />
                </button>
              </li>
            </ul>
          </div>
        );

      case 'display':
        return (
          <div className="dialog-column settings-display">
            <SettingsGroup
              title="Sort type"
              slug="sortType"
              activeSlug={sortType}
              onChange={setSortType}
              renderer={RadioGroup}
            >
              <Item title="Last modified" slug="modificationDate" />
              <Item title="Last created" slug="creationDate" />
              <Item title="Alphabetical" slug="alphabetical" />
            </SettingsGroup>

            <SettingsGroup
              title="Sort order"
              slug="sortOrder"
              activeSlug={sortIsReversed ? 'reversed' : ''}
              onChange={toggleSortOrder}
              renderer={ToggleGroup}
            >
              <Item title="Reversed" slug="reversed" />
            </SettingsGroup>

            <SettingsGroup
              title="Note display"
              slug="noteDisplay"
              activeSlug={noteDisplay}
              onChange={setNoteDisplay}
              renderer={RadioGroup}
            >
              <Item title="Comfy" slug="comfy" />
              <Item title="Condensed" slug="condensed" />
              <Item title="Expanded" slug="expanded" />
            </SettingsGroup>

            <SettingsGroup
              title="Theme"
              slug="theme"
              activeSlug={activeTheme}
              onChange={activateTheme}
              renderer={RadioGroup}
            >
              <Item title="Light" slug="light" />
              <Item title="Dark" slug="dark" />
            </SettingsGroup>
          </div>
        );
    }
  },
});

export default SettingsDialog;
