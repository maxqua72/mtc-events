// plugins/firebase.client.ts
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// Estendiamo le opzioni della notifica per includere 'renotify'
// che manca nelle definizioni standard di TS per il DOM
interface ExtendedNotificationOptions extends NotificationOptions {
  renotify?: boolean;
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.firebase

  // DEBUG: Controlliamo se i dati arrivano al plugin
  console.log('[FIREBASE] Config caricata:', { 
    projectId: config?.projectId, 
    hasApiKey: !!config?.apiKey 
  })

  //console.log('[DEBUG FIREBASE CONFIG]', JSON.stringify(config, null, 2))

  if (!config || !config.apiKey) {
    console.warn('[FIREBASE] Attenzione: Configurazione non ancora disponibile.')
    return // Non crashare, ma esci
  }

  if (!config?.projectId) {
    console.error('[FIREBASE] Errore: projectId mancante nel config!')
    return
  }

  // 1. Inizializza Firebase
  const app = initializeApp(config)
  
  // 2. Ottieni l'istanza di Messaging (solo se siamo nel browser)
  const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

  // Funzione per richiedere il token
  const requestForToken = async () => {
    if (!messaging) return null
    
    try {
      // 1. Registriamo manualmente la tua route dinamica
      // Usiamo un flag per evitare registrazioni multiple se vuoi, 
      // ma navigator.serviceWorker.register è già ottimizzato di suo.
      //const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        //scope: '/firebase-cloud-messaging-push-scope' // Crea un contesto isolato
      //  scope: '/' // Crea un contesto isolato
      //})

      // 2. ATTESA ATTIVAZIONE: Questo risolve il problema "no active Service Worker"
      // Aspettiamo che il worker passi allo stato 'activated'
      //await navigator.serviceWorker.ready
      // 1. NON registrare manualmente. Usa la registrazione esistente del modulo PWA
      const registration = await navigator.serviceWorker.ready

      // Un piccolo trucco extra: se il worker è appena stato installato, 
      // aspettiamo un istante che diventi attivo
      let serviceWorker = registration.active || registration.waiting || registration.installing
/*
      // Se non è ancora attivo, implementiamo un piccolo loop di attesa
      while (registration.active?.state !== 'activated') {
        await new Promise(resolve => setTimeout(resolve, 100))
        // Uscita di sicurezza se il worker fallisce l'attivazione
        if (registration.installing?.state === 'redundant') throw new Error('SW Activation failed')
      }
*/
      // 2. Chiediamo il token passando la registrazione appena creata
      const currentToken = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration // Fondamentale!
      })
      if (currentToken) {
        return currentToken
      } else {
        console.warn('Nessun token di registrazione disponibile. Richiedi permessi.')
        return null
      }
    } catch (err) {
      console.error('Errore durante il recupero del token: ', err)
      return null
    }
  }

  // 3. Ascolta i messaggi quando l'app è APERTA (foreground)
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log('Messaggio ricevuto in primo piano: ', payload)
      // Qui potresti mostrare un toast o un alert personalizzato nell'app

      // Se abbiamo i permessi, forziamo il banner di sistema
      if (Notification.permission === 'granted') {
        const { title, body, icon } = payload.notification || {}

        // Verifichiamo se il Service Worker è disponibile
        if (!navigator.serviceWorker) {
          console.error('[FCM] Service Worker non supportato dal browser')
          return
        }
        
        console.log('icon:', icon)
        // Recuperiamo la registrazione del Service Worker per mostrare la notifica
        navigator.serviceWorker.ready.then((registration) => {
          console.log('[FCM] Service Worker pronto, mostro notifica...')
          

          const notificationOptions: ExtendedNotificationOptions = {
            body: body || '',
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            data: payload.data, 
            tag: payload.messageId || Date.now().toString(), // Raggruppa le notifiche simili
            renotify: true, // Forza la vibrazione/suono anche se il tag è uguale
          };

          registration.showNotification(title || 'Nuova Notifica', notificationOptions)
          .catch(err => console.error('[FCM] Errore:', err));
        
        }).catch(err => {
          console.error('[FCM] Errore SW Ready:', err)
        })
      }
    })
  }

  return {
    provide: {
      fcm: {
        messaging,
        requestForToken
      }
    }
  }
})