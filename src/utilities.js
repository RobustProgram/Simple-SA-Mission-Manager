const NOTIFICATIONS = document.querySelector('#notification-textarea');

module.exports.addNotification = (msg) => {
  const notification = document.createElement('div');
  const notificationText = document.createTextNode(msg);
  notification.setAttribute('class', 'notification');
  notification.appendChild(notificationText);
  NOTIFICATIONS.appendChild(notification);
};
