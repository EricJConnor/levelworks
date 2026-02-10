import { supabase } from './supabase';

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) throw error;
    return data?.publicKey || null;
  } catch (e) {
    console.error('Failed to get VAPID key:', e);
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) throw new Error('VAPID key not available');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    const { error } = await supabase.functions.invoke('save-push-subscription', {
      body: { userId, subscription: subscription.toJSON() }
    });

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Failed to subscribe:', e);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return true;
  } catch (e) {
    console.error('Failed to unsubscribe:', e);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
