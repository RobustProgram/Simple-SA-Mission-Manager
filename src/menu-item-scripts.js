const { ipcRenderer } = require('electron');

// Create the list of scripts to run when a menu item is clicked
module.exports.MENU_ITEM_SCRIPTS = {
  'settings' : () => {
    const saveSettings = () => {
      console.log('SAVE!');
    };

    const gtaSAPath = ipcRenderer.sendSync('getSAPath');
    document.querySelector('#sa-directory').value = gtaSAPath;

    document.querySelector('#save-settings').addEventListener('click', saveSettings);
  }
};
