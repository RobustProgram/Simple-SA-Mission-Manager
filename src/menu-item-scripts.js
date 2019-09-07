const Store = require('electron-store');
const schema = {
  gtaSALocation: { type: 'string' },
  lastMenu: { type: 'string' },
  gtaSAScripts: { type: 'string' },
};
const store = new Store({schema});

// Import custom stuff
const { addNotification } = require('./utilities');
const { addMission, checkMissionFolder } = require('./menu-scripts/mission');

// Create the list of scripts to run when a menu item is clicked
module.exports.MENU_ITEM_SCRIPTS = {
  'settings' : () => {
    const saveSettings = () => {
      addNotification('SAVE!');
    };

    const gtaSAPath = store.get('gtaSALocation');
    const gtaSAScript = store.get('gtaSAScripts');
    const gtaSAText = store.get('gtaSAText');
    document.querySelector('#sa-directory').value = gtaSAPath;
    document.querySelector('#sa-scripts').value = gtaSAScript;
    document.querySelector('#sa-texts').value = gtaSAText;

    document.querySelector('#save-settings').addEventListener('click', saveSettings);
  },
  'about' : () => {
  },
  'missions' : () => {
    // Attach event listeners
    document.querySelector('#btn-add-mission').addEventListener('click', addMission);
    // Check Missions
    checkMissionFolder();
  },
};

module.exports.ENUM_ID = {
  'settings' : 'components/settings.html',
  'about' : 'components/about.html',
  'missions' : 'components/missions.html',
};
