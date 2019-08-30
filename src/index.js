const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const fs = require('fs');

const selectSADirectory = () => {
  const selectedPath = dialog.showOpenDialogSync({properties: ['openDirectory']});
  console.log(selectedPath[0]);
  ipcRenderer.send('updateSAPath', selectedPath[0]);
};

const validateDirectory = () => {
  const gtaSAPath = ipcRenderer.sendSync('getSAPath', {});

  console.log(gtaSAPath);

  fs.readdir(gtaSAPath, (err, files) => {
    if (err) {
      console.log('Unable to access directory: ', err);
      document.querySelector("#information").hidden = true;
      document.querySelector("#need-valid-path").hidden = false;
      return;
    }
  });
}

document.querySelector('#find-sa-directory').addEventListener('click', selectSADirectory);

// When we first load up the index page, we are going to ping the main process and try to get the
// game path.
validateDirectory();
