import getNotificationPermissions from "./notification-api/getNotificationPermissions";
import askPermission from "./notification-api/askPermission";
import urlBase64ToUint8Array from "./push-api/urlBase64ToUint8Array";
import pushNotificationVersion from './push-api/pushNotificationVersion';
import NativeClient from './push-api/native-client'
import SafariPushNotificationClient from './push-api/safari-client'

const pushNotificationClient = pushNotificationVersion();
console.log('pushNotificationClient', pushNotificationClient)

require("dotenv").config();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (!"Notification" in window) {
      // If the browser version is unsupported, remain silent.
      alert("Browser doesn't support push notifications ...");

      return;
    }

    // unregisterOldVersions();

    navigator.serviceWorker
      .register("/sw.js")
      .then(swReg => {
        console.log("Service Worker is registered", swReg);

        if (pushNotificationClient === 'native') {
          const client = new NativeClient(swReg)
          client.initializeUI()
        }
      })
      .catch(e => {
        console.error("Service Worker Error", e);
      });

    if (pushNotificationClient === 'safari') {
      initSafariUI()
    }

    if (window.location.search !== "?live_reload=false") {
      onLoadPermissions();
    } else {
      messagePermissionListener();
    }

    exampleNotification();
  });
}

function unregisterOldVersions() {
  console.log("Unregister old service workers");
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister().then(unregister => console.log(unregister));
    }
  });
}

function messagePermissionListener() {
  const button = document.getElementById("permissions");
  button.onclick = async () => {
    onLoadPermissions();
  };
}

async function onLoadPermissions() {
  const permission = await getNotificationPermissions();

  if (permission === "granted") {
    showNotification();
  } else if (permission === "default") {
    askPermission();
  }
}

function showNotification() {
  navigator.serviceWorker.getRegistration().then(function(reg) {
    const { title, options } = getNotificationData();
    console.log("tag:", options.tag);
    if ("showNotification" in reg) {
      reg.showNotification(title, options);
    } else {
      createNewNotificationMessage();
    }
  });
}

function createNewNotificationMessage() {
  const { title, options } = getNotificationData();
  const n = new Notification(title, options);

  n.onshow = function() {
    console.log("on show message ...");
  };

  // Remove the notification from Notification Center when clicked.
  n.onclick = function() {
    console.log(
      "Remove the notification from Notification Center when clicked."
    );
    this.close();
  };
  // Callback function when the notification is closed.
  n.onclose = function() {
    console.log("Notification closed");
  };
}

function getNotificationData() {
  const title = "New message from Dimitar";
  const options = {
    body: "Dimitar: I'm a developer",

    // ...prevent duplicate notifications
    tag: generateUniqueTag(),

    // There are scenarios where you might want a replacing notification to notify the user rather than silently update. Chat applications are a good example.
    // In this case, you should set tag and renotify to true.
    renotify: true,

    data: {
      // Lets us identity notification
      primaryKey: 1
    }
  };

  if ("actions" in Notification.prototype) {
    console.log("Action buttons are supported.");
    options.actions = getActions();
  } else {
    console.log("Action buttons are NOT supported.");
  }

  return {
    title,
    options
  };
}

function generateUniqueTag() {
  return "unique-string-" + new Date().toString();
}

function getActions() {
  return [
    {
      action: "react-action",
      title: "React"
    },
    {
      action: "angular-action",
      title: "Angular"
    },
    {
      action: "vuejs-action",
      title: "Vuejs"
    },
    {
      action: "ember-action",
      title: "Emberjs"
    }
  ];
}

/*** Buttons  ***/
function exampleNotification() {
  const button = document.getElementById("exampleNotification");
  button.onclick = () => {
    onLoadPermissions();
  };
}

/*** Safari ***/
function initSafariUI() {
  console.log('---- ---- init Safari UI ---- ----')
  const button = document.getElementById('safari-push-notifications')

  button.addEventListener("click", () => {
    const safariPushNotificationClient = new SafariPushNotificationClient(
      'web.com.localhost'
    )

    const permissionData = safariPushNotificationClient.getPermissionData()
    safariPushNotificationClient.checkRemotePermission(permissionData)

    console.log('permissionData:', permissionData)
  })
}