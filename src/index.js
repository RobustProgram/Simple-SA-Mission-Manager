const { dialog } = require('electron').remote;
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

const selectSADirectory = () => {
  const selectedPath = dialog.showOpenDialogSync({properties: ['openDirectory']});
  store.set('gtaSALocation', selectedPath[0]);
  validateDirectory();
};

const rememberLastMenu = id => store.set('lastMenu', id);

// Activate the body to show the manager only once we found the path
const activateBody = () => {
  const lastMenu = store.get('lastMenu');
  document.querySelector('#validation-module').hidden = true;
  document.querySelector('#main-body').hidden = false;
  if (lastMenu !== undefined) {
    loadMenuItem(lastMenu);
  }
};

const validateDirectory = () => {
  const gtaSAPath = store.get('gtaSALocation');
  let files;
  let dataFiles;
  let dataDir;
  let foundGTASA = false;

  try {
    files = fs.readdirSync(gtaSAPath);
  } catch (err) {
    console.log('Can not read from directory: ' + err);
    return;
  }
  
  // After we have read through the files, check each of the files to find the data folder
  for (let file of files) {
    if (file === 'data') {
      // We found 'file' called data. Check if its the data directory
      dataDir = gtaSAPath + '\\' + file;
      if (fs.statSync(dataDir).isDirectory()) {
        // This confirms that we are inside the data directory. Find the directory called script
        dataFiles = fs.readdirSync(dataDir);
        for (let dataFile of dataFiles) {
          if (dataFile === 'script' && fs.statSync(dataDir + '\\' + dataFile).isDirectory()) {
            // Found the script folder inside data
            store.set('gtaSAScripts', dataDir + '\\' + dataFile)
            foundGTASA = true;
            break;
          }
        }
        break;
      }
    }
  }

  if (foundGTASA) {
    activateBody();
  } else {
    console.log('Was unable to find the data/scripts directory in the supplied directory!');
  }
};

const loadMenuItem = id => {
  rememberLastMenu(id);

  fs.readFile(__dirname + '\\' + ENUM_ID[id], (err, data) => {
    document.querySelector('#internal-body').innerHTML = data;
    MENU_ITEM_SCRIPTS[id]();
  });
};

document.querySelector('#find-sa-directory').addEventListener('click', selectSADirectory);
document.querySelector('#btn-settings').addEventListener('click', () => loadMenuItem('settings'));
document.querySelector('#btn-about').addEventListener('click', () => loadMenuItem('about'));

// When we first load up the index page, we are going to ping the main process and try to get the
// game path.
validateDirectory();
