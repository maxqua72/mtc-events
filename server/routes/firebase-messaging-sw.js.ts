// server/routes/firebase-messaging-sw.js.ts
export default defineEventHandler((event) => {
  const config = useRuntimeConfig().public.firebase

  // Imposta l'header corretto per un file JavaScript
  setResponseHeader(event, 'Content-Type', 'application/javascript')

  return `
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "${config.apiKey}",
        authDomain: "${config.authDomain}",
        projectId: "${config.projectId}",
        messagingSenderId: "${config.messagingSenderId}",
        appId: "${config.appId}"
      });
    }

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png', // Assicurati di avere un'icona adatta in /public/icon.png
        data: payload.data // Utile per gestire i clic sulla notifica
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  `
})