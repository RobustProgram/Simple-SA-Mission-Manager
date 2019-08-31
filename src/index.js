const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const path = require('path');
const fs = require('fs');

// Import custom stuff
const { MENU_ITEM_SCRIPTS } = require('./menu-item-scripts');

const selectSADirectory = () => {
  const selectedPath = dialog.showOpenDialogSync({properties: ['openDirectory']});
  ipcRenderer.send('updateSAPath', selectedPath[0]);
};

const rememberLastMenu = id => {
  ipcRenderer.send('rememberLastMenu', id);
}

// Activate the body to show the manager only once we found the path
const activateBody = () => {
  const lastMenu = ipcRenderer.sendSync('getLastMenu');
  document.querySelector('#validation-module').hidden = true;
  document.querySelector('#main-body').hidden = false;
  if (lastMenu !== undefined) {
    loadMenuItem(lastMenu);
  }
};

const validateDirectory = () => {
  const gtaSAPath = ipcRenderer.sendSync('getSAPath');
  let files;
  let foundExecutable = false;
  let filename;

  try {
    files = fs.readdirSync(gtaSAPath);
  } catch (err) {
    console.log('Can not read from directory: ' + err);
    return;
  }
  
  for (let i = 0; i < files.length; ++i) {
    filename = gtaSAPath + '\\' + files[i];
    if (path.extname(filename) === '.exe') {
      foundExecutable = true;
    }
  }

  if (foundExecutable) {
    activateBody();
  } else {
    console.log('Was unable to find any executables in the directory!');
  }
};

const loadMenuItem = id => {
  const enumId = { 'settings' : 'settings.html' };
  
  rememberLastMenu(id);

  fs.readFile(__dirname + '\\' + enumId[id], (err, data) => {
    document.querySelector('#internal-body').innerHTML = data;
    MENU_ITEM_SCRIPTS[id]();
  });
};

document.querySelector('#find-sa-directory').addEventListener('click', selectSADirectory);
document.querySelector('#btn-settings').addEventListener('click', () => loadMenuItem('settings'));

// When we first load up the index page, we are going to ping the main process and try to get the
// game path.
validateDirectory();
