const path = require('path');
const fs = require('fs');

const NOTIFICATIONS = document.querySelector('#notification-textarea');

function addNotification(msg) {
  const notification = document.createElement('div');
  const notificationText = document.createTextNode(msg);
  notification.setAttribute('class', 'notification');
  notification.appendChild(notificationText);
  NOTIFICATIONS.appendChild(notification);
};

module.exports.addNotification = addNotification;

function backUpFile(directory, file) {
  return new Promise((resolve, reject) => {
    if (
      !fs.existsSync(directory + '\\' + file + '.bak') &&
      !fs.statSync(directory + '\\' + file).isDirectory() &&
      path.extname(file) !== '.bak'
    ) {
      // If the file does not have a back up and the 'file' is not a directory and the file is
      // not already a backup file. Proceed!
      addNotification(`Backed up file, ${directory}\\${file}`);
      fs.copyFile(directory + '\\' + file, directory + '\\'+ file + '.bak', err => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      })
    } else {
      addNotification(`Backup for ${file} rejected either because a backup already exists or this is actually a directory`);
      resolve(true);
    }
  });
}

module.exports.backUpFiles = function(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      const filePromises = [];

      if (err) {
        resolve(err);
        return;
      }

      console.log(files);

      for (let file of files) filePromises.push(backUpFile(directory, file));

      Promise.all(filePromises)
        .then(values => resolve(values))
        .catch(err => reject(err));
    });
  });
}
