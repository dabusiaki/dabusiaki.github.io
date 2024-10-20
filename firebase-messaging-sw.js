importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyA04bN5121a28iLwRkJYG8uGTGcVQyFv1Y",
  authDomain: "rodzinkataski.firebaseapp.com",
  projectId: "rodzinkataski",
  storageBucket: "rodzinkataski.appspot.com",
  messagingSenderId: "921333004895",
  appId: "1:921333004895:web:b22bdf6d54a32a4838b9ea",
  measurementId: "G-JM7KL8KDEC"
};

// Inicjalizacja Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Obsługa powiadomień w tle
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // Wstaw tutaj link do swojej ikony
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
