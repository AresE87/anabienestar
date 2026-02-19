import { supabase } from '../supabaseClient';

// VAPID public key — replace with your own after generating with:
// npx web-push generate-vapid-keys
// Store the PRIVATE key as a Supabase secret: VAPID_PRIVATE_KEY
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get current notification permission state
 */
export function getPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('SW registrado:', registration.scope);
    return registration;
  } catch (err) {
    console.error('Error registrando SW:', err);
    return null;
  }
}

/**
 * Convert a base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe user to push notifications
 * Returns the subscription object or null
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    console.warn('Push no soportado en este navegador');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID_PUBLIC_KEY no configurada. Push deshabilitado.');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Save subscription to Supabase
    const subJson = subscription.toJSON();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        usuario_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || null,
        auth: subJson.keys?.auth || null,
        subscription_json: subJson,
        updated_at: new Date().toISOString()
      }, { onConflict: 'usuario_id' })
      .select();

    if (error) {
      console.error('Error guardando subscription:', error);
    } else {
      console.log('Push subscription guardada');
    }

    return subscription;
  } catch (err) {
    console.error('Error subscribing to push:', err);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    // Remove from database
    if (userId) {
      await supabase.from('push_subscriptions').delete().eq('usuario_id', userId);
    }
    return true;
  } catch (err) {
    console.error('Error unsubscribing:', err);
    return false;
  }
}
