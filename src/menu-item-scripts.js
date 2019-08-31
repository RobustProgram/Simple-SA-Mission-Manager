const { ipcRenderer } = require('electron');

// Create the list of scripts to run when a menu item is clicked
module.exports.MENU_ITEM_SCRIPTS = {
  'settings' : () => {
    const gtaSAPath = ipcRenderer.sendSync('getSAPath');
    document.querySelector('#sa-directory').value = gtaSAPath;
  }
};
