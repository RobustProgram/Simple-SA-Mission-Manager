const { app, shell, dialog } = require('electron').remote;
const JSZip = require('jszip');
const path = require('path');
const fs = require('fs');

const Store = require('electron-store');
const schema = {
  gtaSALocation: { type: 'string' },
  lastMenu: { type: 'string' },
  gtaSAScripts: { type: 'string' },
};
const store = new Store({schema});

const { addNotification } = require('../utilities');

/*
 * This is a helper function that does the actual replacing of the files and handles the errors if
 * any should arise.
 */
function loadMissionFile(zipObj, fileName, directory, optional = false) {
  return new Promise((resolve, reject) => {
    // Before we start going through the zip file, let's check if we can write to the original file
    fs.access(directory + '\\' + fileName, fs.constants.W_OK, err => {
      if (err) {
        const messageBoxOptions = {
          type: 'info',
          buttons: ['Ok'],
          default: 0,
          title: 'Read Only',
          message: `${fileName} is set to be read only.`,
          detail: `Disable the readonly property on ${fileName} to continue!`
        };
        dialog.showMessageBoxSync(null, messageBoxOptions);
        reject(err);
        return;
      }

      try {
        zipObj.file(fileName).async('uint8array')
        .then(data => {
          fs.writeFile(directory + '\\' + fileName, data, err => {
            if (err)
              reject(err);
            else
              resolve(true);
          });
        })
        .catch(err => reject(err));
      } catch (err) {
        if (err instanceof TypeError && optional) {
          // Does not exist. However, we do not need to hard fail as this is optional
          resolve(false);
        } else {
          reject(err);
        }
      }
    });
  });
}

/*
 * This function will take the filename of the mission pack and begin to override the original
 * files.
 */
function startMission(fileName) {
  // Here, we are going to replace the scm / img / gxt files with what is inside the mission packs
  // then we are going to launch the game
  const missionDir = app.getPath('userData') + '\\missions';
  const gtaSAPath = store.get('gtaSALocation');
  const gtaSAScript = store.get('gtaSAScripts');
  const gtaSAText = store.get('gtaSAText');
  
  // Proceed to replace the appropriate files
  const missionPack = fs.readFileSync(missionDir + '\\' + fileName);
  JSZip.loadAsync(missionPack).then(zip => {
    const loadGXT = loadMissionFile(zip, 'american.gxt', gtaSAText);
    const loadSCM = loadMissionFile(zip, 'main.scm', gtaSAScript);
    const loadIMG = loadMissionFile(zip, 'script.img', gtaSAScript);

    Promise.all([loadGXT, loadSCM, loadIMG]).then(() => {
      // The files have being loaded and now it is time to run the game!
      shell.openItem(gtaSAPath + '\\gta_sa.exe');
    });
  });
}

module.exports.addMission = function() {
  const missionPack = dialog.showOpenDialogSync({properties: ['openFile']});
  const missionPackName = path.basename(missionPack[0]);
  const missionPackLoaded = app.getPath('userData') + '\\missions\\' + missionPackName;
  const messageBoxOptions = {
    type: 'question',
    buttons: ['Yes', 'No'],
    default: 1,
    title: 'Question',
    message: 'A mission pack with the same name already exists',
    detail: 'Do you want to override the mission pack?'
  };
  let canCopyMission = true;
  
  if (fs.existsSync(missionPackLoaded))
    canCopyMission = dialog.showMessageBoxSync(null, messageBoxOptions) === 1 ? false : true;

  if (canCopyMission) {
    fs.copyFileSync(missionPack[0], missionPackLoaded);
    addNotification('Loaded mission pack: ' + missionPackLoaded);
    this.checkMissionFolder();
  } else {
    addNotification('Can not load mission pack!');
  }
};

module.exports.checkMissionFolder = function() {
  // Here, we are going to do two things, check if a mission folder exists. If it doesn't exist
  // create the folder.
  const missionDir = app.getPath('userData') + '\\missions';
  if (!fs.existsSync(missionDir)) {
    fs.mkdirSync(missionDir);
  } else {
    // If the folder exists, we are going to check if there is any mission packs already added.
    // The following code will refresh the mission display
    document.querySelector('#mission-display').innerHTML = '';
    for(let file of fs.readdirSync(missionDir)) {
      fs.readFile(missionDir + '\\' + file, async (err, data) => {
        if (err) throw err;
        // Go through each of the mission packs and add information regarding them to the list
        JSZip.loadAsync(data).then(zip => {
          zip.file('info.json').async('string').then(data => {
            const missionInfo = JSON.parse(data);
            const mission = document.createElement('div');
            const missionName = document.createElement('div');
            const missionDesc = document.createElement('div');
            const missionAuthor = document.createElement('div');
            const missionVersion = document.createElement('div');
            const missionLaunchWrapper = document.createElement('div');
            const missionLaunch = document.createElement('a');
            let missionDisplay;

            // Set up the elements for the mission info area
            missionName.innerText = missionInfo.name;
            missionDesc.innerText = missionInfo.about;
            missionAuthor.innerText = missionInfo.author;
            missionVersion.innerText = missionInfo.version;
            missionLaunch.innerHTML = '<i class="fas fa-play"></i>&nbsp;&nbsp;Launch Mission';
            mission.className = 'mission';
            missionName.className = 'name';
            missionDesc.className = 'desc';
            missionAuthor.className = 'author';
            missionVersion.className = 'version';
            missionLaunchWrapper.className = 'launch';
            missionLaunch.className = 'button is-primary is-rounded';

            // Add the event listener
            missionLaunch.addEventListener('click', () => startMission(file));

            // Add the elements of the display to the mission info section
            missionLaunchWrapper.appendChild(missionLaunch);
            mission.appendChild(missionName);
            mission.appendChild(missionDesc);
            mission.appendChild(missionAuthor);
            mission.appendChild(missionVersion);
            mission.appendChild(missionLaunchWrapper);

            // Display it
            missionDisplay = document.querySelector('#mission-display');
            if (missionDisplay != undefined) {
              missionDisplay.appendChild(mission);
            }
          });
        });
      });
    }
  }
};
