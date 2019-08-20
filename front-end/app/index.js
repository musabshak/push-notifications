import getNotificationPermissions from "./notification-api/getNotificationPermissions";
import askPermission from "./notification-api/askPermission";
import urlBase64ToUint8Array from "./push-api/urlBase64ToUint8Array";

require("dotenv").config();

let isSubscribed = false;
let swRegistration = null;

const pushButton = document.getElementById("js-push-btn");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (!"Notification" in window) {
      // If the browser version is unsupported, remain silent.
      alert("Browser doesn't support push notifications ...");

      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(swReg => {
        console.log("Service Worker is registered", swReg);

        swRegistration = swReg;

        initializeUI();
      })
      .catch(e => {
        console.error("Service Worker Error", e);
      });

    // unregisterOldVersions();

    subscribeUserToPush();

    if (window.location.search !== "?live_reload=false") {
      onLoadPermissions();
    } else {
      messagePermissionListener();
    }

    exampleNotification();
  });
}

function initializeUI() {
  pushButton.addEventListener("click", () => {
    pushButton.disabled = true;

    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });
}

function loadServiceWorker() {
  navigator.serviceWorker
    .register("/sw.js")
    .then(registration => {
      console.log("SW registered: ", registration);
    })
    .catch(registrationError => {
      console.log("SW registration failed: ", registrationError);
    });
}

function subscribeUserToPush() {
  return navigator.serviceWorker
    .register("/sw.js")
    .then(registration => {
      console.log("SW registered: ", registration);

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VAPID_PUBLIC_KEY
        )
      };

      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(function(pushSubscription) {
      console.log(
        "Received PushSubscription:",
        JSON.stringify(pushSubscription)
      );
      return pushSubscription;
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

/*** Push notifications ***/
function unsubscribeUser() {
  swRegistration.pushManager
    .getSubscription()
    .then(subscription => {
      if (subscription) return subscription;
    })
    .catch(e => {
      console.error("Error unsubscribing", e);
    })
    .then(() => {
      updateSubscriptionOnServer(null);

      console.log("User is unsubscribed");
      isSubscribed = false;

      updatePushBtn();
    });
}

function updatePushBtn() {
  if (Notification.permission === "denied") {
    pushButton.textContent = "Push messaging blocked";
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = "Disable Push Messaging";
  } else {
    pushButton.textContent = "Enable Push Messaging";
  }

  pushButton.disabled = false;
}

function updateSubscriptionOnServer(subscription) {
  // Here's where you would send the subscription to the application server

  const subscriptionJson = document.getElementById("js-subscription-json");
  const endpointURL = document.getElementById("js-endpoint-url");
  const subAndEndpoint = document.getElementById("js-endpoint-url");

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    endpointURL.textContent = subscription.endpoint;
    subAndEndpoint.style.display = "block";
  } else {
    subAndEndpoint.style.display = "none";
  }
}
