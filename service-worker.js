const CACHE_NAME = 'pwa-posts-v1.2';
const API_CACHE_NAME = 'pwa-posts-api-v1.2';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json'
];

// API URLs to cache
const API_URLS = [
  'https://jsonplaceholder.typicode.com/posts'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate the service worker immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;
  const isApiRequest = API_URLS.some(apiUrl => requestUrl.includes(apiUrl.replace('https://jsonplaceholder.typicode.com', '')));
  
  if (isApiRequest) {
    // Handle API requests with network-first strategy
    event.respondWith(handleApiRequest(event.request));
  } else if (event.request.destination === 'document' || 
             event.request.destination === 'script' || 
             event.request.destination === 'style') {
    // Handle static assets with cache-first strategy
    event.respondWith(handleStaticRequest(event.request));
  }
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  try {
    console.log('Service Worker: Fetching API request from network:', request.url);
    
    // Try to fetch from network first
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Clone the response because it can only be consumed once
      const responseClone = networkResponse.clone();
      
      // Cache the successful response
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, responseClone);
      
      console.log('Service Worker: Cached API response:', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response was not ok');
    
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    
    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If no cache available, return a custom offline response
    console.log('Service Worker: No cache available for:', request.url);
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No cached data available' 
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving static asset from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('Service Worker: Fetching static asset from network:', request.url);
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache the response
      const responseClone = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseClone);
      
      console.log('Service Worker: Cached static asset:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url);
    
    // For HTML requests, return the cached index.html (for SPA routing)
    if (request.destination === 'document') {
      const cachedIndex = await caches.match('/');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    throw error;
  }
}

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      syncData()
    );
  }
});

async function syncData() {
  try {
    // Attempt to refresh cached data
    const cache = await caches.open(API_CACHE_NAME);
    
    for (const apiUrl of API_URLS) {
      try {
        console.log('Service Worker: Background syncing:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (response && response.status === 200) {
          await cache.put(apiUrl, response.clone());
          console.log('Service Worker: Background sync successful for:', apiUrl);
        }
      } catch (error) {
        console.log('Service Worker: Background sync failed for:', apiUrl, error);
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync error:', error);
  }
}

// Handle push notifications (if supported)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  const title = 'PWA Posts';
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-192.png',
    tag: 'pwa-posts-notification',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});