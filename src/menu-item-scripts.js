const { app, dialog } = require('electron').remote;
const JSZip = require("jszip");
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
const { addNotification } = require('./utilities');

// Create the list of scripts to run when a menu item is clicked
module.exports.MENU_ITEM_SCRIPTS = {
  'settings' : () => {
    const saveSettings = () => {
      addNotification('SAVE!');
    };

    const gtaSAPath = store.get('gtaSALocation');
    const gtaSAScript = store.get('gtaSAScripts');
    document.querySelector('#sa-directory').value = gtaSAPath;
    document.querySelector('#sa-scripts').value = gtaSAScript;

    document.querySelector('#save-settings').addEventListener('click', saveSettings);
  },
  'about' : () => {
  },
  'missions' : () => {
    const checkMissionFolder = () => {
      const missionDir = app.getPath('userData') + '\\missions';
      if (!fs.existsSync(missionDir)) {
        fs.mkdirSync(missionDir);
      } else {
        for(let file of fs.readdirSync(missionDir)) {
          fs.readFile(missionDir + '\\' + file, async (err, data) => {
            if (err) throw err;
            JSZip.loadAsync(data).then(zip => {
              zip.file('info.json').async('string').then(data => {
                const missionInfo = JSON.parse(data);
                const mission = document.createElement('div');
                const missionName = document.createElement('div');
                const missionDesc = document.createElement('div');
                const missionAuthor = document.createElement('div');
                const missionVersion = document.createElement('div');
                let missionDisplay;

                missionName.innerText = missionInfo.name;
                missionDesc.innerText = missionInfo.about;
                missionAuthor.innerText = missionInfo.author;
                missionVersion.innerText = missionInfo.version;
                mission.className = 'mission';
                missionName.className = 'name';
                missionDesc.className = 'desc';
                missionAuthor.className = 'author';
                missionVersion.className = 'version';

                mission.appendChild(missionName);
                mission.appendChild(missionDesc);
                mission.appendChild(missionAuthor);
                mission.appendChild(missionVersion);

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
    const addMission = () => {
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
        checkMissionFolder();
      } else {
        addNotification('Can not load mission pack!');
      }
    };
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
