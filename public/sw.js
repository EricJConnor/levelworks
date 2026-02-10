// Service Worker v8 - FORCE CACHE CLEAR - Fixed edge function URLs
const CACHE_NAME = 'contractor-tool-v8';

// On install, IMMEDIATELY clear ALL caches and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW v8] Installing - FORCE clearing all caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(name => {
          console.log('[SW v8] Deleting cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('[SW v8] All caches cleared, skipping waiting');
      return self.skipWaiting();
    })
  );
});

// On activate, claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW v8] Activating - claiming all clients');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(name => {
          console.log('[SW v8] Clearing remaining cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('[SW v8] Claiming clients');
      return self.clients.claim();
    })
  );
});

// NO FETCH HANDLER - Let browser handle ALL network requests normally
// This ensures API calls are never intercepted or cached

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'New Notification', body: 'You have a new notification', type: 'general' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    tag: data.type || 'general',
    renotify: true,
    actions: getActionsForType(data.type)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

function getActionsForType(type) {
  switch (type) {
    case 'estimate_viewed':
      return [{ action: 'view', title: 'View Estimate' }];
    case 'estimate_signed':
      return [{ action: 'view', title: 'View Details' }, { action: 'invoice', title: 'Create Invoice' }];
    case 'payment_received':
      return [{ action: 'view', title: 'View Payment' }];
    default:
      return [{ action: 'view', title: 'View' }];
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/';
  
  if (data.estimateId) url = `/estimates/${data.estimateId}`;
  else if (data.invoiceId) url = `/invoices/${data.invoiceId}`;
  else if (data.jobId) url = `/jobs/${data.jobId}`;
  
  if (event.action === 'invoice' && data.estimateId) {
    url = `/invoices/new?estimateId=${data.estimateId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
