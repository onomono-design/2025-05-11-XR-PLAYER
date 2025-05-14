// Service worker for 360° video player
// Import media URLs from config
self.importScripts('./js/config.js');

const CACHE_NAME = 'vr-media-cache-v2'; // Incremented version
const VIDEO_CACHE_NAME = 'vr-video-cache-v2';
const AUDIO_CACHE_NAME = 'vr-audio-cache-v2';

// ENHANCEMENT: Add cache expiration
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Assets to cache on install
const CACHED_ASSETS = [
  './',
  './index.html',
  './script.js',
  './styles.css',
  './js/config.js'
];

// Media URLs will be imported from config
let MEDIA_URLS = [];

// ENHANCEMENT: Enhanced fetch with retry logic
const fetchWithRetry = async (request, retries = 3, delay = 500) => {
  let attempt = 0;
  let lastError;

  while (attempt < retries) {
    try {
      return await fetch(request.clone());
    } catch (error) {
      lastError = error;
      console.log(`Fetch attempt ${attempt + 1} failed:`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      attempt++;
    }
  }

  console.error(`All fetch attempts failed for ${request.url}:`, lastError);
  throw lastError;
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  
  // Try to get media URLs from config
  try {
    if (self.MEDIA_URLS && Array.isArray(self.MEDIA_URLS)) {
      MEDIA_URLS = self.MEDIA_URLS;
      console.log('Media URLs imported from config:', MEDIA_URLS.length);
    } else {
      console.warn('Media URLs not found in config or not an array');
    }
  } catch (error) {
    console.error('Error importing media URLs from config:', error);
  }
  
  // Fallback if import fails
  if (MEDIA_URLS.length === 0) {
    MEDIA_URLS = [
      'https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.mp4',
      'https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.m3u8',
      'https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-low.webm',
      'https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-04-10-JAPANTOWN-XR/2025-04-21-CHINATOWN-XR-UPDATE/2025-04-21-CHINATOWN-XR-2b-ultralow.mp4',
      'https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.mp3',
      'https://cmm-cloud-2.s3.us-west-1.amazonaws.com/WALKING+TOURS/2025-03-15-CHINATOWN/2025-03-15-CHINATOWN-MP3S/2025-04-21-SHORTER-MP3-CHAPTERS/2025-04-21-Chapter+2+Look+Tin+Eli.ogg'
    ];
  }
  
  // Cache static assets with retry logic
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return Promise.all(
          CACHED_ASSETS.map(async (url) => {
            try {
              // Try to fetch with retry logic
              const response = await fetchWithRetry(new Request(url));
              await cache.put(url, response);
              console.log(`Cached ${url} successfully`);
            } catch (error) {
              console.error(`Failed to cache ${url}:`, error);
              // Continue with installation even if some assets fail
            }
          })
        );
      })
      .catch(error => {
        console.error('Service worker installation error:', error);
        // Still allow the service worker to install even if caching fails
      })
  );
  
  // Force activation without waiting for tabs to close
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  
  // Clean up old cache versions
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName.startsWith('vr-') && 
                  cacheName !== CACHE_NAME && 
                  cacheName !== VIDEO_CACHE_NAME &&
                  cacheName !== AUDIO_CACHE_NAME;
          }).map(cacheName => {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        // ENHANCEMENT: Clean expired cache entries
        return cleanExpiredCache();
      })
  );
  
  // Take control of all clients immediately
  return self.clients.claim();
});

// ENHANCEMENT: Function to clean expired cache entries
const cleanExpiredCache = async () => {
  const now = Date.now();
  
  try {
    // Clean video cache
    const videoCache = await caches.open(VIDEO_CACHE_NAME);
    const videoCacheKeys = await videoCache.keys();
    
    for (const request of videoCacheKeys) {
      const response = await videoCache.match(request);
      const headers = new Headers(response.headers);
      const cacheTime = headers.get('x-cache-time');
      
      if (cacheTime && now - parseInt(cacheTime) > CACHE_MAX_AGE) {
        console.log(`Removing expired video cache: ${request.url}`);
        await videoCache.delete(request);
      }
    }
    
    // Clean audio cache
    const audioCache = await caches.open(AUDIO_CACHE_NAME);
    const audioCacheKeys = await audioCache.keys();
    
    for (const request of audioCacheKeys) {
      const response = await audioCache.match(request);
      const headers = new Headers(response.headers);
      const cacheTime = headers.get('x-cache-time');
      
      if (cacheTime && now - parseInt(cacheTime) > CACHE_MAX_AGE) {
        console.log(`Removing expired audio cache: ${request.url}`);
        await audioCache.delete(request);
      }
    }
    
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
};

// Helper to determine resource type
const getResourceType = (url) => {
  if (url.endsWith('.mp4') || url.includes('video') || url.endsWith('.m3u8') || url.endsWith('.webm')) {
    return 'video';
  } else if (url.endsWith('.mp3') || url.includes('audio') || url.endsWith('.ogg')) {
    return 'audio';
  }
  return 'other';
};

// ENHANCEMENT: Enhanced range request handling with error recovery
const handleRangeRequest = async (request, response) => {
  // Clone the response to manipulate it
  const clonedResponse = response.clone();
  
  // Get the range header from the request
  const rangeHeader = request.headers.get('range');
  
  // If no range header, just return the response
  if (!rangeHeader) {
    return response;
  }
  
  try {
    // Parse the range header
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (!rangeMatch) {
      return response;
    }
    
    // Get the range values
    const start = parseInt(rangeMatch[1], 10);
    const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;
    
    // Get the buffer
    const buffer = await clonedResponse.arrayBuffer();
    const totalSize = buffer.byteLength;
    
    // Validate range request
    if (start >= totalSize) {
      // If range is invalid, return 416 Range Not Satisfiable
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${totalSize}`
        }
      });
    }
    
    const sliceEnd = end !== undefined ? Math.min(end + 1, totalSize) : totalSize;
    const slicedBuffer = buffer.slice(start, sliceEnd);
    
    // Create a new response with the sliced data and appropriate headers
    const headers = new Headers(clonedResponse.headers);
    headers.set('Content-Range', `bytes ${start}-${sliceEnd - 1}/${totalSize}`);
    headers.set('Content-Length', slicedBuffer.byteLength.toString());
    
    // Return the new response
    return new Response(slicedBuffer, {
      status: 206,
      statusText: 'Partial Content',
      headers
    });
  } catch (error) {
    console.error('Error handling range request:', error);
    // If we can't handle the range request correctly, fall back to the full response
    return response;
  }
};

// ENHANCEMENT: Add timestamp to cache responses
const addCacheTimestamp = (response) => {
  const headers = new Headers(response.headers);
  headers.set('x-cache-time', Date.now().toString());
  
  return response.body
    ? new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    : response;
};

// Fetch event - respond with cached resources
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // ENHANCEMENT: Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle media files specifically
  if (MEDIA_URLS.some(mediaUrl => event.request.url.includes(mediaUrl) || event.request.url === mediaUrl)) {
    const resourceType = getResourceType(event.request.url);
    const cacheName = resourceType === 'video' ? VIDEO_CACHE_NAME : 
                      resourceType === 'audio' ? AUDIO_CACHE_NAME : 
                      CACHE_NAME;
    
    // Use cache-first strategy for media files
    event.respondWith(
      caches.open(cacheName)
        .then(cache => {
          return cache.match(event.request)
            .then(cachedResponse => {
              // If range request and cached response exists, handle specially
              if (event.request.headers.has('range') && cachedResponse) {
                return handleRangeRequest(event.request, cachedResponse);
              }
              
              // Return cached response if it exists
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If not cached, fetch from network and cache
              return fetchWithRetry(event.request)
                .then(networkResponse => {
                  // Add timestamp and cache a clone of the response
                  const timestampedResponse = addCacheTimestamp(networkResponse.clone());
                  cache.put(event.request, timestampedResponse);
                  return networkResponse;
                })
                .catch(error => {
                  console.error(`Failed to fetch ${event.request.url}:`, error);
                  
                  // Try to return a similar media file from cache if available
                  return findSimilarMediaInCache(event.request, cache)
                    .then(similarResponse => {
                      if (similarResponse) {
                        console.log(`Returning similar media for ${event.request.url}`);
                        return similarResponse;
                      }
                      
                      // If nothing found, throw the error
                      throw error;
                    });
                });
            });
        })
        .catch(error => {
          console.error(`Cache error for ${event.request.url}:`, error);
          // If all cache operations fail, try direct network request
          return fetch(event.request);
        })
    );
    return;
  }
  
  // For non-media files, use standard cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetchWithRetry(event.request)
          .then(networkResponse => {
            // Only cache static assets from our domain
            if (event.request.url.startsWith(self.location.origin) && 
                event.request.method === 'GET') {
              // Open the cache and put the new response
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, networkResponse.clone());
                });
            }
            
            // Return the network response
            return networkResponse;
          });
      })
      .catch(error => {
        console.error(`Failed to handle request for ${event.request.url}:`, error);
        // If no response available, could return a fallback page here
        
        // For now, let the browser handle the error
        throw error;
      })
  );
});

// ENHANCEMENT: Find similar media in cache as a fallback
const findSimilarMediaInCache = async (request, cache) => {
  const url = request.url;
  const keys = await cache.keys();
  
  // Look for media files with similar names but different formats
  for (const key of keys) {
    const keyUrl = key.url;
    
    // Check if it's a similar file (same base name but different extension)
    // For example, if mp4 fails, try webm or m3u8
    if (url !== keyUrl && 
        (url.includes(keyUrl.split('.')[0]) || keyUrl.includes(url.split('.')[0]))) {
      console.log(`Found similar media: ${keyUrl} (for ${url})`);
      return cache.match(key);
    }
  }
  
  // If we couldn't find a similar format, try a lower quality version
  // For example, if high-quality video fails, try low-quality version
  if (url.includes('-low') && !url.includes('-ultralow')) {
    for (const key of keys) {
      if (key.url.includes('-ultralow')) {
        console.log(`Falling back to lower quality: ${key.url} (for ${url})`);
        return cache.match(key);
      }
    }
  }
  
  return null;
};

// Listen for message to prime the media cache
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'primeMediaCache') {
    // Prime media cache by preloading videos and audio
    Promise.all(
      MEDIA_URLS.map(url => {
        const resourceType = getResourceType(url);
        const cacheName = resourceType === 'video' ? VIDEO_CACHE_NAME : 
                          resourceType === 'audio' ? AUDIO_CACHE_NAME : 
                          CACHE_NAME;
                          
        return caches.open(cacheName)
          .then(cache => {
            return cache.match(new Request(url))
              .then(cachedResponse => {
                if (!cachedResponse) {
                  console.log(`Service Worker: Preloading ${resourceType}`, url);
                  return fetchWithRetry(new Request(url))
                    .then(response => {
                      // Add timestamp before caching
                      const timestampedResponse = addCacheTimestamp(response.clone());
                      return cache.put(url, timestampedResponse);
                    })
                    .catch(err => console.log(`Failed to preload ${url}:`, err));
                }
              });
          });
      })
    ).then(() => {
      console.log('Service Worker: Media cache primed');
      // Notify the client the media is cached
      event.source.postMessage({
        action: 'mediaCached',
        status: 'success'
      });
    }).catch(err => {
      console.log('Service Worker: Failed to prime media cache', err);
      // Notify the client of failure
      event.source.postMessage({
        action: 'mediaCached',
        status: 'error',
        error: err.message
      });
    });
  } else if (event.data && event.data.action === 'clearCache') {
    // ENHANCEMENT: Add ability to clear cache on demand
    Promise.all([
      caches.delete(VIDEO_CACHE_NAME),
      caches.delete(AUDIO_CACHE_NAME)
    ])
    .then(() => {
      console.log('Service Worker: Media cache cleared');
      event.source.postMessage({
        action: 'cacheCleared',
        status: 'success'
      });
    })
    .catch(err => {
      console.error('Service Worker: Failed to clear cache', err);
      event.source.postMessage({
        action: 'cacheCleared',
        status: 'error',
        error: err.message
      });
    });
  } else if (event.data && event.data.action === 'checkCacheStatus') {
    // ENHANCEMENT: Add ability to check cache status
    Promise.all([
      caches.open(VIDEO_CACHE_NAME).then(cache => cache.keys()),
      caches.open(AUDIO_CACHE_NAME).then(cache => cache.keys())
    ])
    .then(([videoKeys, audioKeys]) => {
      event.source.postMessage({
        action: 'cacheStatus',
        status: 'success',
        data: {
          videoCached: videoKeys.length,
          audioCached: audioKeys.length,
          cacheSize: 'unknown' // Could be calculated with more effort
        }
      });
    })
    .catch(err => {
      console.error('Service Worker: Failed to check cache status', err);
      event.source.postMessage({
        action: 'cacheStatus',
        status: 'error',
        error: err.message
      });
    });
  }
}); 