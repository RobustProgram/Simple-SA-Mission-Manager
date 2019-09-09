const { dialog } = require('electron').remote;
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const schema = {
  gtaSALocation: { type: 'string' },
  lastMenu: { type: 'string' },
  gtaSAScripts: { type: 'string' },
};
const store = new Store({schema});

// Import custom stuff
const { ENUM_ID, MENU_ITEM_SCRIPTS } = require('./menu-item-scripts');
const { addNotification, backUpFiles } = require('./utilities');

function selectSADirectory() {
  const selectedPath = dialog.showOpenDialogSync({properties: ['openDirectory']});
  store.set('gtaSALocation', selectedPath[0]);
  validateDirectory();
}

// Activate the body to show the manager only once we found the path
function activateBody() {
  const lastMenu = store.get('lastMenu');
  document.querySelector('#find-sa-directory').disabled = true;
  toggleMenuBtns();
  if (lastMenu !== undefined && lastMenu !== 'spec_notification') {
    loadMenuItem(lastMenu);
  } else if (lastMenu === 'spec_notification') {
    loadNotification();
  }
}

function validateDirectory() {
  const gtaSAPath = store.get('gtaSALocation');
  let files;
  let dataDir;
  let scriptsDir;
  let foundGTASA = false;

  try {
    files = fs.readdirSync(gtaSAPath);
  } catch (err) {
    addNotification('Can not read from directory! You need to select the GTA SA folder! ' + err);
    document.querySelector('#find-sa-directory').disabled = false;
    return;
  }

  // After we have read through the files, check each of the files to find the data folder
  for (let file of files) {
    if (file === 'data') {
      // We found 'file' called data. Check if its the data directory
      dataDir = gtaSAPath + '\\' + file;
      if (fs.statSync(dataDir).isDirectory()) {
        // This confirms that we are inside the data directory. Find the directory called script
        for (let dataFile of fs.readdirSync(dataDir)) {
          if (dataFile === 'script' && fs.statSync(dataDir + '\\' + dataFile).isDirectory()) {
            // Found the script folder inside data
            scriptsDir = dataDir + '\\' + dataFile;
            store.set('gtaSAScripts', scriptsDir);
            foundGTASA = true;
            break; // Exit early to save performance. However, we are using electron
          }
        }
        break; // Exit early to save performance. However, we are using electron
      }
    }
  }

  if (foundGTASA) {
    // If we found the gtaSAPath, we are going to assume we are in it and just save the text folder
    const textDir = gtaSAPath + '\\text';
    const backUpPromises = [
      backUpFiles(scriptsDir),
      backUpFiles(textDir)
    ];
    store.set('gtaSAText', textDir);

    Promise.all(backUpPromises)
      .then(() => {activateBody();})
      .catch(err => {console.log(err)});
  } else {
    addNotification('Was unable to find the data/scripts directory in the supplied directory!');
    document.querySelector('#find-sa-directory').disabled = false;
  }
}

function loadMenuItem (id) {
  store.set('lastMenu', id);
  fs.readFile(__dirname + '\\' + ENUM_ID[id], (err, data) => {
    document.querySelector('#internal-body').innerHTML = data;
    MENU_ITEM_SCRIPTS[id]();
    document.querySelector('#internal-body').style.display = 'flex';
    document.querySelector('#notification').style.display = 'none';
  });
}

function loadNotification() {
  store.set('lastMenu', 'spec_notification');
  document.querySelector('#internal-body').style.display = 'none';
  document.querySelector('#notification').style.display = 'flex';
}

function toggleMenuBtns() {
  const btnElements = document.querySelectorAll('#internal-menu ul li button');
  for (let btn of btnElements) {
    btn.disabled = !btn.disabled;
  }
}

document.querySelector('#find-sa-directory').addEventListener('click', selectSADirectory);
document.querySelector('#btn-notifications').addEventListener('click', loadNotification);
document.querySelector('#btn-missions').addEventListener('click', () => loadMenuItem('missions'));
document.querySelector('#btn-settings').addEventListener('click', () => loadMenuItem('settings'));
document.querySelector('#btn-about').addEventListener('click', () => loadMenuItem('about'));

// When we first load up the index page, we are going to ping the main process and try to get the
// game path.
validateDirectory();
